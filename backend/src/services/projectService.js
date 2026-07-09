const db = require('../config/db');

class ProjectService {
    formatProject(project) {
        if (!project) return null;
        const status = project.statut || 'Initiation';
        let progress = 0;
        switch (status) {
            case 'Initiation':    progress = 20; break;
            case 'Développement': progress = 40; break;
            case 'Testing':       progress = 60; break;
            case 'Déploiement':     progress = 80; break;
            case 'Utilisation':   progress = 100; break;
        }
        return { ...project, status, progress };
    }

    getAll() {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM projects ORDER BY created_at DESC', (err, results) => {
                if (err) return reject(err);
                resolve(results.map(p => this.formatProject(p)));
            });
        });
    }

    create(projectData) {
        return new Promise((resolve, reject) => {
            db.query('SELECT COUNT(*) AS count FROM projects', (err, results) => {
                if (err) return reject(err);
                const count = results[0].count + 1;
                const newId = `PRJ-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

                const { nom, chefProjet, description, demandeId } = projectData;
                const dateCreation = new Date().toLocaleDateString('fr-FR');
                const statut = projectData.status || 'Initiation';

                const query = 'INSERT INTO projects (id, nom, chefProjet, statut, description, dateCreation, demandeId) VALUES (?, ?, ?, ?, ?, ?, ?)';
                db.query(query, [newId, nom, chefProjet, statut, description, dateCreation, demandeId], (err) => {
                    if (err) return reject(err);
                    resolve(this.formatProject({ id: newId, ...projectData, statut, dateCreation }));
                });
            });
        });
    }

    updateStatus(id, statut) {
        return new Promise((resolve, reject) => {
            db.query('UPDATE projects SET statut = ? WHERE id = ?', [statut, id], (err) => {
                if (err) return reject(err);
                this.getById(id).then(resolve).catch(reject);
            });
        });
    }

    update(id, data) {
        return new Promise((resolve, reject) => {
            let query = 'UPDATE projects SET ';
            const updates = [];
            const values = [];

            if (data.status !== undefined || data.statut !== undefined) {
                updates.push('statut = ?');
                values.push(data.status || data.statut);
            }
            if (data.chefProjet !== undefined) {
                updates.push('chefProjet = ?');
                values.push(data.chefProjet);
            }
            if (data.demandeId !== undefined) {
                updates.push('demandeId = ?');
                values.push(data.demandeId);
            }
            if (data.backlogStatus !== undefined) {
                updates.push('backlogStatus = ?');
                values.push(data.backlogStatus);
            }
            if (data.architectureStatus !== undefined) {
                updates.push('architectureStatus = ?');
                values.push(data.architectureStatus);
            }
            if (data.sponsorComment !== undefined) {
                updates.push('sponsorComment = ?');
                values.push(data.sponsorComment);
            }
            if (data.backlogFile !== undefined) {
                updates.push('backlogFile = ?');
                values.push(data.backlogFile);
            }
            if (data.architectureFile !== undefined) {
                updates.push('architectureFile = ?');
                values.push(data.architectureFile);
            }
            // atelierCadrage field support
            if (data.atelierCadrage !== undefined) {
                updates.push('atelierCadrage = ?');
                values.push(data.atelierCadrage);
            }
            // charterValidated flag
            if (data.charterValidated !== undefined) {
                updates.push('charterValidated = ?');
                values.push(data.charterValidated ? 1 : 0);
            }

            if (updates.length === 0) return resolve({ id });

            query += updates.join(', ') + ' WHERE id = ? OR demandeId = ?';
            values.push(id, id);

            db.query(query, values, (err) => {
                if (err) return reject(err);
                this.getById(id).then(resolve).catch(reject);
            });
        });
    }

    delete(id) {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM projects WHERE id = ?', [id], (err) => {
                if (err) return reject(err);
                resolve({ id });
            });
        });
    }

    getById(id) {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM projects WHERE id = ?', [id], (err, results) => {
                if (err) return reject(err);
                resolve(this.formatProject(results[0]) || null);
            });
        });
    }

    /**
     * Auto-update project status based on:
     * - Initiation → Développement  : architecture + backlog validated (already done in update)
     * - Développement → Testing     : ALL tasks are Fait/Clôturée/Archivée (at least 1 task)
     * - Testing → Livraison         : ALL test cases are Réussite (at least 1 test case)
     */
    autoUpdateStatus(projectId, io) {
        return new Promise((resolve, reject) => {
            // Fetch project
            db.query('SELECT * FROM projects WHERE id = ?', [projectId], (err, pResults) => {
                if (err) return reject(err);
                if (pResults.length === 0) return resolve(null);

                const project = pResults[0];
                const currentStatus = project.statut || 'Initiation';

                // Helper to persist status change
                const applyStatus = (newStatus) => {
                    db.query('UPDATE projects SET statut = ? WHERE id = ?', [newStatus, projectId], (err) => {
                        if (err) return reject(err);
                        this.getById(projectId).then(updatedProject => {
                            if (io && updatedProject) io.emit('project_updated', updatedProject);
                            resolve(updatedProject);
                        }).catch(reject);
                    });
                };

                // Fetch tasks and test cases in parallel
                const getTasks = new Promise((resTasks, rejTasks) => {
                    db.query('SELECT * FROM tasks WHERE projectId = ?', [projectId], (err, results) => {
                        if (err) return rejTasks(err);
                        resTasks(results);
                    });
                });

                const getTestCases = new Promise((resTests, rejTests) => {
                    db.query('SELECT * FROM test_cases WHERE projectId = ?', [projectId], (err, results) => {
                        if (err) return rejTests(err);
                        resTests(results);
                    });
                });

                Promise.all([getTasks, getTestCases]).then(([tasks, testCases]) => {
                    const totalTasks = tasks.length;
                    const doneTasks = tasks.filter(t => ['Fait', 'Clôturée', 'Archivée'].includes(t.status));
                    const hasUnfinishedTasks = tasks.some(t => !['Fait', 'Clôturée', 'Archivée'].includes(t.status));

                    const totalTests = testCases.length;
                    const allTestsPassed = totalTests > 0 && testCases.every(t => t.status === 'Réussite');

                    // Determine target status based on current states
                    let targetStatus = currentStatus;

                    // 1. If there are tasks, and some are unfinished, the project CANNOT be past Développement.
                    if (totalTasks > 0 && hasUnfinishedTasks) {
                        if (['Testing', 'Déploiement', 'Utilisation'].includes(currentStatus)) {
                            targetStatus = 'Développement';
                            console.log(`[AutoStatus] ${projectId}: ${currentStatus} → Développement (tâches non terminées)`);
                        }
                    }
                    // 2. If all tasks are finished, and we have tests but they are not all passed, the project CANNOT be past Testing.
                    else if (!hasUnfinishedTasks && totalTests > 0 && !allTestsPassed) {
                        if (['Déploiement', 'Utilisation'].includes(currentStatus)) {
                            targetStatus = 'Testing';
                            console.log(`[AutoStatus] ${projectId}: ${currentStatus} → Testing (tests non réussis)`);
                        }
                    }
                    // 3. Forward: If in Développement and all tasks are finished
                    else if (currentStatus === 'Développement' && totalTasks > 0 && !hasUnfinishedTasks) {
                        targetStatus = 'Testing';
                        console.log(`[AutoStatus] ${projectId}: Développement → Testing (toutes les tâches terminées)`);
                    }
                    // 4. Forward: If in Testing and all tests are passed
                    else if (currentStatus === 'Testing' && allTestsPassed) {
                        targetStatus = 'Déploiement';
                        console.log(`[AutoStatus] ${projectId}: Testing → Déploiement (tous les cas de test réussis)`);
                    }

                    if (targetStatus !== currentStatus) {
                        applyStatus(targetStatus);
                    } else {
                        resolve(null);
                    }
                }).catch(reject);
            });
        });
    }

    getProjectsByUserId(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT p.* 
                FROM projects p
                JOIN project_members pm ON p.id = pm.projectId
                WHERE pm.userId = ?
                ORDER BY p.created_at DESC
            `;
            db.query(query, [userId], (err, results) => {
                if (err) return reject(err);
                resolve(results.map(p => this.formatProject(p)));
            });
        });
    }
}

module.exports = new ProjectService();
