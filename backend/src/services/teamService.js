const db = require('../config/db');

class TeamService {
    getAllMembers() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT pm.projectId, pm.userId, pm.role, u.nom, u.prenom, u.email, u.fonction
                FROM project_members pm
                JOIN users u ON pm.userId = u.id
            `;
            db.query(query, (err, results) => {
                if (err) return reject(err);
                
                const teamsMap = {};
                results.forEach(row => {
                    if (!teamsMap[row.projectId]) {
                        teamsMap[row.projectId] = [];
                    }
                    teamsMap[row.projectId].push({
                        userId: row.userId,
                        role: row.role,
                        user: {
                            nom: row.nom,
                            prenom: row.prenom,
                            email: row.email,
                            fonction: row.fonction
                        }
                    });
                });
                
                const teamsList = Object.keys(teamsMap).map(projectId => ({
                    projectId,
                    members: teamsMap[projectId]
                }));
                
                resolve(teamsList);
            });
        });
    }

    getProjectMembers(projectId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT pm.userId, pm.role, u.nom, u.prenom, u.email, u.fonction
                FROM project_members pm
                JOIN users u ON pm.userId = u.id
                WHERE pm.projectId = ?
            `;
            db.query(query, [projectId], (err, results) => {
                if (err) return reject(err);
                
                
                const members = results.map(row => ({
                    userId: row.userId,
                    role: row.role,
                    user: {
                        nom: row.nom,
                        prenom: row.prenom,
                        email: row.email,
                        fonction: row.fonction
                    }
                }));
                
                resolve(members);
            });
        });
    }

    addOrUpdateMember(projectId, userId, role) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO project_members (projectId, userId, role)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE role = ?
            `;
            db.query(query, [projectId, userId, role, role], (err, results) => {
                if (err) return reject(err);
                
                
                const userQuery = 'SELECT nom, prenom, email, fonction FROM users WHERE id = ?';
                db.query(userQuery, [userId], (err, userResults) => {
                    if (err || userResults.length === 0) return reject(err || new Error('User not found'));
                    
                    resolve({
                        userId,
                        role,
                        user: userResults[0]
                    });
                });
            });
        });
    }

    removeMember(projectId, userId) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM project_members WHERE projectId = ? AND userId = ?';
            db.query(query, [projectId, userId], (err, results) => {
                if (err) return reject(err);
                resolve({ projectId, userId });
            });
        });
    }
}

module.exports = new TeamService();
