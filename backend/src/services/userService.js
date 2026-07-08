const db = require('../config/db');
const bcrypt = require('bcrypt');

class UserService {
    getAll() {
        return new Promise((resolve, reject) => {
            db.query('SELECT id, matricule, nom, prenom, fonction, telephone, emailPersonnelle, email, role, archived FROM users ORDER BY created_at DESC', (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    create(userData) {
        return new Promise(async (resolve, reject) => {
            try {
                const newId = 'u' + (Date.now() + Math.floor(Math.random() * 1000));
                const { matricule, nom, prenom, fonction, telephone, emailPersonnelle, email, role, password } = userData;
                
                const passwordToHash = password || Math.random().toString(36).slice(-8);
                const hashedPassword = await bcrypt.hash(passwordToHash, 10);
                
                const query = 'INSERT INTO users (id, matricule, nom, prenom, fonction, telephone, emailPersonnelle, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                db.query(query, [newId, matricule, nom, prenom, fonction, telephone, emailPersonnelle, email, hashedPassword, role || 'User'], (err) => {
                    if (err) return reject(err);
                    resolve({ id: newId, matricule, nom, prenom, fonction, telephone, emailPersonnelle, email, role: role || 'User', archived: 0 });
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    update(id, userData) {
        return new Promise((resolve, reject) => {
            const { matricule, nom, prenom, fonction, telephone, emailPersonnelle, email, role } = userData;
            const query = 'UPDATE users SET matricule=?, nom=?, prenom=?, fonction=?, telephone=?, emailPersonnelle=?, email=?, role=? WHERE id=?';
            db.query(query, [matricule, nom, prenom, fonction, telephone, emailPersonnelle, email, role, id], (err) => {
                if (err) return reject(err);
                resolve({ id, ...userData });
            });
        });
    }

    setArchiveStatus(id, isArchived) {
        return new Promise((resolve, reject) => {
            db.query('UPDATE users SET archived=? WHERE id=?', [isArchived ? 1 : 0, id], (err) => {
                if (err) return reject(err);
                resolve({ id, archived: isArchived });
            });
        });
    }

    getById(id) {
        return new Promise((resolve, reject) => {
            db.query('SELECT id, matricule, nom, prenom, fonction, telephone, emailPersonnelle, email, role, archived FROM users WHERE id = ?', [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }
}

module.exports = new UserService();
