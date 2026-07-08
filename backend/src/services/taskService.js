const db = require('../config/db');

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

    create(taskData) {
        return new Promise((resolve, reject) => {
            const { id, projectId, title, description, priority, assigneeId, status } = taskData;
            const query = 'INSERT INTO tasks (id, projectId, title, description, priority, assigneeId, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
            db.query(query, [id, projectId, title, description || null, priority, assigneeId || null, status], (err) => {
                if (err) return reject(err);
                resolve({ id, ...taskData, createdAt: new Date().toISOString() });
            });
        });
    }

    update(id, updates) {
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

            if (fields.length === 0) return resolve({ id });

            query += fields.join(', ') + ' WHERE id = ?';
            values.push(id);

            db.query(query, values, (err) => {
                if (err) return reject(err);
                resolve({ id, ...updates });
            });
        });
    }

    updateStatus(id, status) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE tasks SET status = ? WHERE id = ?';
            db.query(query, [status, id], (err) => {
                if (err) return reject(err);
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

    delete(id) {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM tasks WHERE id = ?', [id], (err) => {
                if (err) return reject(err);
                resolve({ id });
            });
        });
    }
}

module.exports = new TaskService();
