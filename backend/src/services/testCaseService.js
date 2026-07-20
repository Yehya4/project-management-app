const db = require('../config/db');
const projectService = require('./projectService');

class TestCaseService {
    getByProjectId(projectId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM test_cases WHERE projectId = ? ORDER BY createdAt DESC';
            db.query(query, [projectId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    getById(id) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM test_cases WHERE id = ?';
            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }

    create(testCaseData, io) {
        return new Promise((resolve, reject) => {
            const { projectId, testCaseId, testName, description, expectedResult, actualResult, priority, assignedTo, attachment, profile, rubrique } = testCaseData;
            const query = 'INSERT INTO test_cases (projectId, testCaseId, testName, description, expectedResult, actualResult, status, priority, assignedTo, attachment, profile, rubrique) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            db.query(query, [projectId, testCaseId, testName, description, expectedResult, actualResult || null, 'En attente', priority || 'Moyenne', assignedTo || null, attachment || null, profile || null, rubrique || null], async (err, results) => {
                if (err) return reject(err);

                                try {
                    const insertedId = results.insertId;
                    const testCase = await this.getById(insertedId);

                                        if (io) {
                        io.emit('test_case_created', testCase);
                    }
                    await projectService.autoUpdateStatus(projectId, io);
                    resolve(testCase);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    update(id, data, io) {
        return new Promise((resolve, reject) => {
            const { testCaseId, testName, description, expectedResult, actualResult, priority, assignedTo, attachment, profile, rubrique } = data;
            const query = 'UPDATE test_cases SET testCaseId = ?, testName = ?, description = ?, expectedResult = ?, actualResult = ?, priority = ?, assignedTo = ?, attachment = ?, profile = ?, rubrique = ? WHERE id = ?';
            db.query(query, [testCaseId, testName, description, expectedResult, actualResult || null, priority || 'Moyenne', assignedTo || null, attachment || null, profile || null, rubrique || null, id], async (err) => {
                if (err) return reject(err);

                                try {
                    const testCase = await this.getById(id);
                    if (io) {
                        io.emit('test_case_updated', testCase);
                    }
                    if (testCase && testCase.projectId) {
                        await projectService.autoUpdateStatus(testCase.projectId, io);
                    }
                    resolve(testCase);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    updateStatus(id, status, comment, testerId, testerName, io, actualResult) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE test_cases SET status = ?, comment = ?, testerId = ?, testerName = ?, actualResult = COALESCE(?, actualResult) WHERE id = ?';
            db.query(query, [status, comment || null, testerId || null, testerName || null, actualResult || null, id], async (err) => {
                if (err) return reject(err);

                                try {
                    const testCase = await this.getById(id);
                    if (io) {
                        io.emit('test_case_updated', testCase);
                    }
                    if (testCase && testCase.projectId) {
                        await projectService.autoUpdateStatus(testCase.projectId, io);
                    }
                    resolve(testCase);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    delete(id, io) {
        return new Promise((resolve, reject) => {
            this.getById(id).then(testCase => {
                if (!testCase) return resolve({ id });

                                const query = 'DELETE FROM test_cases WHERE id = ?';
                db.query(query, [id], async (err) => {
                    if (err) return reject(err);

                                        if (io) {
                        io.emit('test_case_deleted', { id: parseInt(id) || id });
                    }
                    await projectService.autoUpdateStatus(testCase.projectId, io);
                    resolve({ id });
                });
            }).catch(reject);
        });
    }
}

module.exports = new TestCaseService();
