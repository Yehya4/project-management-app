const db = require('../config/db');

class ProjectService {
    getAll() {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM projects ORDER BY created_at DESC', (err, results) => {
                if (err) return reject(err);
                resolve(results);
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
                    resolve({ id: newId, ...projectData, status: statut, dateCreation });
                });
            });
        });
    }

    updateStatus(id, statut) {
        return new Promise((resolve, reject) => {
            db.query('UPDATE projects SET statut = ? WHERE id = ?', [statut, id], (err) => {
                if (err) return reject(err);
                resolve({ id, status: statut });
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

            if (updates.length === 0) return resolve({ id });

            query += updates.join(', ') + ' WHERE id = ? OR demandeId = ?';
            values.push(id, id);

            db.query(query, values, (err) => {
                if (err) return reject(err);
                resolve({ id, ...data });
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
                resolve(results[0] || null);
            });
        });
    }

    autoUpdateStatus(projectId, io) {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM tasks WHERE projectId = ?', [projectId], (err, tasks) => {
                if (err) return reject(err);
                
                db.query('SELECT * FROM projects WHERE id = ?', [projectId], (err, pResults) => {
                    if (err) return reject(err);
                    if (pResults.length === 0) return resolve();
                    
                    const project = pResults[0];
                    let newStatus = 'Initiation';
                    
                    if (tasks.length > 0) {
                        const hasEnCours = tasks.some(t => t.status === 'En cours');
                        const hasFait = tasks.some(t => t.status === 'Fait');
                        const allCloturee = tasks.every(t => t.status === 'Clôturée');
                        const allArchivee = tasks.every(t => t.status === 'Archivée');
                        
                        if (hasEnCours) {
                            newStatus = 'Développement';
                        } else if (hasFait) {
                            newStatus = 'Testing';
                        } else if (allArchivee) {
                            newStatus = 'Utilisation';
                        } else if (allCloturee) {
                            newStatus = 'Livraison';
                        } else {
                            
                            const hasCloturee = tasks.some(t => t.status === 'Clôturée');
                            if (hasCloturee) {
                                newStatus = 'Livraison';
                            } else {
                                newStatus = 'Utilisation';
                            }
                        }
                    }
                    
                    if (project.statut !== newStatus) {
                        db.query('UPDATE projects SET statut = ? WHERE id = ?', [newStatus, projectId], (err) => {
                            if (err) return reject(err);
                            
                            const updatedProject = { ...project, status: newStatus, statut: newStatus };
                            if (io) {
                                io.emit('project_updated', updatedProject);
                            }
                            resolve(updatedProject);
                        });
                    } else {
                        resolve(null);
                    }
                });
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
                resolve(results);
            });
        });
    }
}

module.exports = new ProjectService();
