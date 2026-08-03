const db = require('../config/db');

class ProjectService {

    /**
     * Calcule la progression système basée sur les tâches/tests du projet.
     * Retourne une valeur dans la plage de la phase actuelle.
     */
    async getSystemProgress(projectId, statut) {
        return new Promise((resolve) => {
            if (statut === 'Utilisation') return resolve(100);
            if (statut === 'Initiation') return resolve(15);

            db.query('SELECT * FROM tasks WHERE projectId = ?', [projectId], (err, tasks) => {
                if (err || !tasks) return resolve(null);

                const totalTasks = tasks.length;
                const doneTasks = tasks.filter(t => ['Fait', 'Clôturée', 'Archivée'].includes(t.status)).length;
                const taskRatio = totalTasks > 0 ? doneTasks / totalTasks : 0;

                if (statut === 'Développement') {
                    // 15% → 80% selon le % de tâches terminées
                    const sysProgress = Math.round(15 + taskRatio * 65);
                    return resolve(Math.min(80, Math.max(15, sysProgress)));
                }

                db.query('SELECT * FROM test_cases WHERE projectId = ?', [projectId], (err2, tests) => {
                    if (err2 || !tests) return resolve(null);

                    const totalTests = tests.length;
                    const passedTests = tests.filter(t => t.status === 'Réussite').length;
                    const testRatio = totalTests > 0 ? passedTests / totalTests : 0;

                    if (statut === 'Testing') {
                        // 80% → 90% selon le % de tests validés
                        const sysProgress = Math.round(80 + testRatio * 10);
                        return resolve(Math.min(90, Math.max(80, sysProgress)));
                    }

                    if (statut === 'Déploiement') {
                        // 90% de base, gestion séparée pour 100%
                        return resolve(90);
                    }

                    return resolve(null);
                });
            });
        });
    }

    /**
     * Formate un projet et calcule sa progression finale.
     * progress = manualProgress dans la plage de la phase (ou valeur minimale de la phase).
     */
    formatProject(project) {
        if (!project) return null;
        const status = project.statut || 'Initiation';
        let progress = 15;

        const manual = project.manualProgress != null ? parseInt(project.manualProgress) : null;

        switch (status) {
            case 'Initiation':
                progress = 15;
                break;
            case 'Développement':
                progress = manual != null ? Math.min(80, Math.max(15, manual)) : 15;
                break;
            case 'Testing':
                progress = manual != null ? Math.min(90, Math.max(80, manual)) : 80;
                break;
            case 'Déploiement':
                progress = manual != null ? Math.min(100, Math.max(90, manual)) : 90;
                break;
            case 'Utilisation':
                progress = 100;
                break;
            default:
                progress = 15;
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
                let formattedChef = chefProjet || 'Project Manager (PM)';
                if (formattedChef.toLowerCase() === 'project manager' || formattedChef.toLowerCase() === 'chef de projet') {
                  formattedChef = 'Project Manager (PM)';
                } else if (!formattedChef.includes('(')) {
                  formattedChef = `${formattedChef} (PM)`;
                }
                const dateCreation = new Date().toLocaleDateString('fr-FR');
                const statut = projectData.status || 'Initiation';

                const query = 'INSERT INTO projects (id, nom, chefProjet, statut, description, dateCreation, demandeId) VALUES (?, ?, ?, ?, ?, ?, ?)';
                db.query(query, [newId, nom, formattedChef, statut, description, dateCreation, demandeId], (err) => {
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

    /**
     * Met à jour la progression manuelle du projet (PM/Admin/Sponsor).
     * Vérifie que la valeur est dans la plage autorisée selon la phase.
     * Prend le max entre la valeur manuelle et la valeur système.
     */
    updateProgress(id, manualProgress, io) {
        return new Promise((resolve, reject) => {
            this.getById(id).then(project => {
                if (!project) return reject(new Error('Projet non trouvé'));

                const statut = project.statut || 'Initiation';
                let minVal = 15, maxVal = 15;

                switch (statut) {
                    case 'Développement': minVal = 15; maxVal = 80; break;
                    case 'Testing':       minVal = 80; maxVal = 90; break;
                    case 'Déploiement':   minVal = 90; maxVal = 100; break;
                    default:
                        // Pas de contrôle manuel pour Initiation/Utilisation
                        return resolve(project);
                }

                const clampedProgress = Math.min(maxVal, Math.max(minVal, parseInt(manualProgress)));

                // Recalcule la progression système et prend le max
                this.getSystemProgress(id, statut).then(sysProgress => {
                    const finalProgress = sysProgress != null
                        ? Math.max(clampedProgress, sysProgress)
                        : clampedProgress;
                    const finalManual = Math.min(maxVal, Math.max(minVal, finalProgress));

                    db.query('UPDATE projects SET manualProgress = ? WHERE id = ?', [finalManual, id], (err) => {
                        if (err) return reject(err);
                        this.getById(id).then(updated => {
                            if (io && updated) io.emit('project_updated', updated);
                            resolve(updated);
                        }).catch(reject);
                    });
                }).catch(() => {
                    db.query('UPDATE projects SET manualProgress = ? WHERE id = ?', [clampedProgress, id], (err) => {
                        if (err) return reject(err);
                        this.getById(id).then(updated => {
                            if (io && updated) io.emit('project_updated', updated);
                            resolve(updated);
                        }).catch(reject);
                    });
                });
            }).catch(reject);
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
            if (data.deploymentPlanFile !== undefined) {
                updates.push('deploymentPlanFile = ?');
                values.push(data.deploymentPlanFile);
            }
            if (data.deploymentPlanStatus !== undefined) {
                updates.push('deploymentPlanStatus = ?');
                values.push(data.deploymentPlanStatus);
            }
            if (data.deploymentValidatedBy !== undefined) {
                updates.push('deploymentValidatedBy = ?');
                values.push(data.deploymentValidatedBy);
            }
            if (data.deploymentValidatedAt !== undefined) {
                updates.push('deploymentValidatedAt = ?');
                values.push(data.deploymentValidatedAt);
            }
            if (data.manualProgress !== undefined) {
                updates.push('manualProgress = ?');
                values.push(data.manualProgress);
            }
            if (data.suiviPostDeploiement !== undefined) {
                updates.push('suiviPostDeploiement = ?');
                values.push(data.suiviPostDeploiement ? 1 : 0);
            }
            if (data.suiviPostDeploiementBy !== undefined) {
                updates.push('suiviPostDeploiementBy = ?');
                values.push(data.suiviPostDeploiementBy);
            }
            if (data.suiviPostDeploiementAt !== undefined) {
                updates.push('suiviPostDeploiementAt = ?');
                values.push(data.suiviPostDeploiementAt);
            }
            if (data.clotureBy !== undefined) {
                updates.push('clotureBy = ?');
                values.push(data.clotureBy);
            }
            if (data.clotureAt !== undefined) {
                updates.push('clotureAt = ?');
                values.push(data.clotureAt);
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

                const applyStatus = (newStatus, newManualProgress) => {
                    let setClauses = 'statut = ?';
                    let vals = [newStatus];
                    if (newManualProgress !== undefined) {
                        setClauses += ', manualProgress = ?';
                        vals.push(newManualProgress);
                    }
                    vals.push(projectId);

                    db.query(`UPDATE projects SET ${setClauses} WHERE id = ?`, vals, (err) => {
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
                    const doneTasks = tasks.filter(t => ['Fait', 'Clôturée', 'Archivée'].includes(t.status)).length;
                    const taskRatio = totalTasks > 0 ? doneTasks / totalTasks : 0;

                    const totalTests = testCases.length;
                    const allTestsPassed = totalTests > 0 && testCases.every(t => t.status === 'Réussite');
                    const passedTests = testCases.filter(t => t.status === 'Réussite').length;
                    const testRatio = totalTests > 0 ? passedTests / totalTests : 0;

                    let targetStatus = currentStatus;
                    let targetManualProgress = undefined;

                    if (currentStatus === 'Développement') {
                        // Progression système automatique en développement
                        const sysProgress = Math.min(80, Math.max(20, Math.round(20 + taskRatio * 60)));
                        const currentManual = project.manualProgress != null ? parseInt(project.manualProgress) : 20;
                        const newManual = Math.max(currentManual, sysProgress);
                        if (newManual !== currentManual) {
                            targetManualProgress = newManual;
                        }
                        // Transition vers Testing si toutes tâches terminées
                        if (totalTasks > 0 && !hasUnfinishedTasks) {
                            targetStatus = 'Testing';
                            targetManualProgress = 80; // Début Testing à 80%
                        }
                    } else if (currentStatus === 'Testing') {
                        // Progression système automatique en testing
                        const sysProgress = Math.min(90, Math.max(80, Math.round(80 + testRatio * 10)));
                        const currentManual = project.manualProgress != null ? parseInt(project.manualProgress) : 80;
                        const newManual = Math.max(currentManual, sysProgress);
                        if (newManual !== currentManual) {
                            targetManualProgress = newManual;
                        }
                        // Si des tâches redeviennent non terminées, revenir en Développement
                        if (totalTasks > 0 && hasUnfinishedTasks) {
                            targetStatus = 'Développement';
                            targetManualProgress = 20;
                        }
                    } else if (currentStatus === 'Déploiement') {
                        // Si tests non tous passés et tâches non terminées, revenir en Testing
                        if (totalTests > 0 && !allTestsPassed && totalTasks > 0 && hasUnfinishedTasks) {
                            targetStatus = 'Testing';
                            targetManualProgress = 80;
                        }
                    }

                    if (targetStatus !== currentStatus || targetManualProgress !== undefined) {
                        applyStatus(targetStatus, targetManualProgress);
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
