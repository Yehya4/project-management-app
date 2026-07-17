const db = require('../config/db');
const { encrypt, decrypt } = require('../utils/cryptoUtil');

class NotificationService {
    addNotification(notificationData) {
        return new Promise((resolve, reject) => {
            const { id, userId, role, type, title, message, link } = notificationData;

                        const encryptedTitle = encrypt(title);
            const encryptedMessage = encrypt(message);

            const query = `INSERT INTO notifications (id, userId, role, type, title, message, link, isRead) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`;

                        db.query(query, [id, userId || null, role || null, type, encryptedTitle, encryptedMessage, link || null], (err) => {
                if (err) return reject(err);

                resolve({
                    ...notificationData,
                    title,
                    message,
                    isRead: false,
                    createdAt: new Date().toISOString()
                });
            });
        });
    }

    getNotificationsForUser(userId, role) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM notifications WHERE userId = ? OR role = ? ORDER BY createdAt DESC LIMIT 100`;
            db.query(query, [userId, role], (err, results) => {
                if (err) return reject(err);

                                const decryptedResults = results.map(row => ({
                    ...row,
                    title: decrypt(row.title),
                    message: decrypt(row.message),
                    isRead: row.isRead === 1 || row.isRead === true
                }));
                resolve(decryptedResults);
            });
        });
    }

    markAsRead(id) {
        return new Promise((resolve, reject) => {
            db.query('UPDATE notifications SET isRead = 1 WHERE id = ?', [id], (err) => {
                if (err) return reject(err);
                resolve({ id, read: true });
            });
        });
    }

        markAllAsRead(userId, role) {
        return new Promise((resolve, reject) => {
            db.query('UPDATE notifications SET isRead = 1 WHERE userId = ? OR role = ?', [userId, role], (err) => {
                if (err) return reject(err);
                resolve({ success: true });
            });
        });
    }

    deleteNotification(id) {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM notifications WHERE id = ?', [id], (err) => {
                if (err) return reject(err);
                resolve({ success: true });
            });
        });
    }
}

module.exports = new NotificationService();
