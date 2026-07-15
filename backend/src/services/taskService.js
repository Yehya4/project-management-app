const db = require('../config/db');
const projectService = require('./projectService');

class TaskService {
    getAll() {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM tasks ORDER BY createdAt DESC', (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    getByProjectId(projectId) {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM tasks WHERE projectId = ? ORDER BY createdAt DESC', [projectId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    create(taskData, io) {
        return new Promise((resolve, reject) => {
            const { id, projectId, title, description, priority, assigneeId, status, reference, objet, dateDebutReel, dateFinReel, dateFin } = taskData;
            const query = 'INSERT INTO tasks (id, projectId, title, description, priority, assigneeId, status, reference, objet, dateDebutReel, dateFinReel, dateFin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            db.query(query, [id, projectId, title, description || null, priority, assigneeId || null, status, reference || null, objet || null, dateDebutReel || null, dateFinReel || null, dateFin || null], async (err) => {
                if (err) return reject(err);
                const task = { id, ...taskData, createdAt: new Date().toISOString() };
                
                if (io) {
                    io.emit('task_created', task);
                }
                try {
                    await projectService.autoUpdateStatus(projectId, io);
                } catch (projectErr) {
                    console.error(projectErr);
                }
                resolve(task);
            });
        });
    }

    update(id, updates, io) {
        return new Promise((resolve, reject) => {
            let query = 'UPDATE tasks SET ';
            const fields = [];
            const values = [];

            if (updates.title !== undefined) {
                fields.push('title = ?');
                values.push(updates.title);
            }
            if (updates.description !== undefined) {
                fields.push('description = ?');
                values.push(updates.description || null);
            }
            if (updates.priority !== undefined) {
                fields.push('priority = ?');
                values.push(updates.priority);
            }
            if (updates.assigneeId !== undefined) {
                fields.push('assigneeId = ?');
                values.push(updates.assigneeId || null);
            }
            if (updates.status !== undefined) {
                fields.push('status = ?');
                values.push(updates.status);
            }
            if (updates.reference !== undefined) {
                fields.push('reference = ?');
                values.push(updates.reference || null);
            }
            if (updates.objet !== undefined) {
                fields.push('objet = ?');
                values.push(updates.objet || null);
            }
            if (updates.dateDebutReel !== undefined) {
                fields.push('dateDebutReel = ?');
                values.push(updates.dateDebutReel || null);
            }
            if (updates.dateFinReel !== undefined) {
                fields.push('dateFinReel = ?');
                values.push(updates.dateFinReel || null);
            }
            if (updates.dateFin !== undefined) {
                fields.push('dateFin = ?');
                values.push(updates.dateFin || null);
            }

            if (fields.length === 0) return resolve({ id });

            query += fields.join(', ') + ' WHERE id = ?';
            values.push(id);

            db.query(query, values, async (err) => {
                if (err) return reject(err);
                const task = { id, ...updates };
                
                try {
                    const taskData = await this.getById(id);
                    if (io) {
                        io.emit('task_updated', taskData);
                    }
                    if (taskData) {
                        await projectService.autoUpdateStatus(taskData.projectId, io);
                    }
                } catch (dataErr) {
                    console.error(dataErr);
                }
                resolve(task);
            });
        });
    }

    updateStatus(id, status, io) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE tasks SET status = ? WHERE id = ?';
            db.query(query, [status, id], async (err) => {
                if (err) return reject(err);
                
                try {
                    const taskData = await this.getById(id);
                    if (io) {
                        io.emit('task_updated', taskData);
                    }
                    if (taskData) {
                        await projectService.autoUpdateStatus(taskData.projectId, io);
                    }
                } catch (dataErr) {
                    console.error(dataErr);
                }
                resolve({ id, status });
            });
        });
    }

    getById(id) {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM tasks WHERE id = ?', [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }

    delete(id, io) {
        return new Promise((resolve, reject) => {
            this.getById(id).then(taskData => {
                db.query('DELETE FROM tasks WHERE id = ?', [id], async (err) => {
                    if (err) return reject(err);
                    
                    if (io) {
                        io.emit('task_deleted', { id });
                    }
                    if (taskData) {
                        try {
                            await projectService.autoUpdateStatus(taskData.projectId, io);
                        } catch (projectErr) {
                            console.error(projectErr);
                        }
                    }
                    resolve({ id });
                });
            }).catch(reject);
        });
    }
}

module.exports = new TaskService();
