const db = require('../config/db');

class DocumentService {
    getByProjectId(projectId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM project_documents WHERE projectId = ? ORDER BY createdAt DESC';
            db.query(query, [projectId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    create(documentData, io) {
        return new Promise((resolve, reject) => {
            const { projectId, name, type, format, content, module } = documentData;
            const query = 'INSERT INTO project_documents (projectId, name, type, format, content, module) VALUES (?, ?, ?, ?, ?, ?)';
            db.query(query, [projectId, name, type, format, content || null, module || null], async (err, results) => {
                if (err) return reject(err);
                try {
                    const insertedId = results.insertId;
                    const docQuery = 'SELECT * FROM project_documents WHERE id = ?';
                    db.query(docQuery, [insertedId], (err, res) => {
                        if (err) return reject(err);
                        const newDoc = res[0];
                        if (io) {
                            io.emit('document_created', newDoc);
                        }
                        resolve(newDoc);
                    });
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    delete(id, io) {
        return new Promise((resolve, reject) => {
            const getQuery = 'SELECT * FROM project_documents WHERE id = ?';
            db.query(getQuery, [id], (err, results) => {
                if (err) return reject(err);
                const doc = results[0];
                if (!doc) return resolve({ id });

                const query = 'UPDATE project_documents SET is_archived = 1 WHERE id = ?';
                db.query(query, [id], async (err) => {
                    if (err) return reject(err);
                    if (io) {
                        io.emit('document_deleted', { id: parseInt(id) || id, projectId: doc.projectId, archived: true });
                    }
                    resolve({ id });
                });
            });
        });
    }

    restore(id, io) {
        return new Promise((resolve, reject) => {
            const getQuery = 'SELECT * FROM project_documents WHERE id = ?';
            db.query(getQuery, [id], (err, results) => {
                if (err) return reject(err);
                const doc = results[0];
                if (!doc) return resolve({ id });

                const query = 'UPDATE project_documents SET is_archived = 0 WHERE id = ?';
                db.query(query, [id], async (err) => {
                    if (err) return reject(err);
                    if (io) {
                        io.emit('document_restored', { id: parseInt(id) || id, projectId: doc.projectId });
                    }
                    resolve({ id });
                });
            });
        });
    }
}

module.exports = new DocumentService();
