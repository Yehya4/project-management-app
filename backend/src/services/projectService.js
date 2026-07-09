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
            case 'Déploiement':   progress = 80; break;
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

    create(projectData, io) {
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
                    const formatted = this.formatProject({ id: newId, ...projectData, statut, dateCreation });
                    if (io) {
                        io.emit('project_updated', formatted);
                    }
                    resolve(formatted);
                });
            });
        });
    }

    updateStatus(id, statut, io) {
        return new Promise((resolve, reject) => {
            db.query('UPDATE projects SET statut = ? WHERE id = ?', [statut, id], (err) => {
                if (err) return reject(err);
                this.getById(id).then(project => {
                    if (io && project) {
                        io.emit('project_updated', project);
                    }
                    resolve(project);
                }).catch(reject);
            });
        });
    }

    update(id, data, io) {
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
            if (data.atelierCadrage !== undefined) {
                updates.push('atelierCadrage = ?');
                values.push(data.atelierCadrage);
            }
            if (data.charterValidated !== undefined) {
                updates.push('charterValidated = ?');
                values.push(data.charterValidated ? 1 : 0);
            }

            if (updates.length === 0) {
                return this.autoUpdateStatus(id, io).then(async (updatedProject) => {
                    if (!updatedProject && io) {
                        const project = await this.getById(id);
                        if (project) io.emit('project_updated', project);
                    }
                    resolve({ id });
                }).catch(reject);
            }

            query += updates.join(', ') + ' WHERE id = ? OR demandeId = ?';
            values.push(id, id);

            db.query(query, values, (err) => {
                if (err) return reject(err);
                this.autoUpdateStatus(id, io).then(async (updatedProject) => {
                    if (!updatedProject && io) {
                        const project = await this.getById(id);
                        if (project) io.emit('project_updated', project);
                    }
                    this.getById(id).then(resolve).catch(reject);
                }).catch(reject);
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

    autoUpdateStatus(projectId, io) {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM projects WHERE id = ?', [projectId], (err, pResults) => {
                if (err) return reject(err);
                if (pResults.length === 0) return resolve(null);

                const project = pResults[0];
                const currentStatus = project.statut || 'Initiation';

                const applyStatus = (newStatus) => {
                    db.query('UPDATE projects SET statut = ? WHERE id = ?', [newStatus, projectId], (err) => {
                        if (err) return reject(err);
                        this.getById(projectId).then(updatedProject => {
                            if (io && updatedProject) io.emit('project_updated', updatedProject);
                            resolve(updatedProject);
                        }).catch(reject);
                    });
                };

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
                    const hasUnfinishedTasks = tasks.some(t => !['Fait', 'Clôturée', 'Archivée'].includes(t.status));

                    const totalTests = testCases.length;
                    const allTestsPassed = totalTests > 0 && testCases.every(t => t.status === 'Réussite');

                    let targetStatus = currentStatus;

                    if (totalTasks > 0 && hasUnfinishedTasks) {
                        if (['Testing', 'Déploiement', 'Utilisation'].includes(currentStatus)) {
                            targetStatus = 'Développement';
                        }
                    }
                    else if (!hasUnfinishedTasks && totalTests > 0 && !allTestsPassed) {
                        if (['Déploiement', 'Utilisation'].includes(currentStatus)) {
                            targetStatus = 'Testing';
                        }
                    }
                    else if (currentStatus === 'Développement' && totalTasks > 0 && !hasUnfinishedTasks) {
                        targetStatus = 'Testing';
                    }
                    else if (currentStatus === 'Testing' && allTestsPassed) {
                        targetStatus = 'Déploiement';
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
