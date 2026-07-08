const db = require('../config/db');

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

    create(testCaseData) {
        return new Promise((resolve, reject) => {
            const { projectId, testCaseId, testName, description, expectedResult } = testCaseData;
            const query = 'INSERT INTO test_cases (projectId, testCaseId, testName, description, expectedResult, status) VALUES (?, ?, ?, ?, ?, ?)';
            db.query(query, [projectId, testCaseId, testName, description, expectedResult, 'En attente'], (err, results) => {
                if (err) return reject(err);
                
                const insertedId = results.insertId;
                this.getById(insertedId)
                    .then(testCase => resolve(testCase))
                    .catch(err => reject(err));
            });
        });
    }

    update(id, data) {
        return new Promise((resolve, reject) => {
            const { testCaseId, testName, description, expectedResult } = data;
            const query = 'UPDATE test_cases SET testCaseId = ?, testName = ?, description = ?, expectedResult = ? WHERE id = ?';
            db.query(query, [testCaseId, testName, description, expectedResult, id], (err) => {
                if (err) return reject(err);
                this.getById(id)
                    .then(testCase => resolve(testCase))
                    .catch(err => reject(err));
            });
        });
    }

    updateStatus(id, status, comment, testerId, testerName) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE test_cases SET status = ?, comment = ?, testerId = ?, testerName = ? WHERE id = ?';
            db.query(query, [status, comment || null, testerId || null, testerName || null, id], (err) => {
                if (err) return reject(err);
                this.getById(id)
                    .then(testCase => resolve(testCase))
                    .catch(err => reject(err));
            });
        });
    }

    delete(id) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM test_cases WHERE id = ?';
            db.query(query, [id], (err) => {
                if (err) return reject(err);
                resolve({ id });
            });
        });
    }
}

module.exports = new TestCaseService();
