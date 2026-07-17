const db = require('../config/db');
const { encrypt, decrypt } = require('../utils/cryptoUtil');

class MessageService {
    addMessage(messageData) {
        return new Promise((resolve, reject) => {
            const { id, senderId, senderName, senderRole, recipientId, projectId, content, mentions } = messageData;

                        const encryptedContent = encrypt(content);
            const mentionsStr = mentions ? JSON.stringify(mentions) : null;
            const messageId = id || Date.now().toString() + Math.random().toString(36).substring(7);

            const query = `INSERT INTO messages (id, senderId, senderName, senderRole, recipientId, projectId, content, mentions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

                        db.query(query, [messageId, senderId, senderName, senderRole, recipientId || null, projectId || null, encryptedContent, mentionsStr], (err) => {
                if (err) return reject(err);

                                resolve({
                    ...messageData,
                    id: messageId,
                    content: content,
                    createdAt: new Date().toISOString()
                });
            });
        });
    }

    getMessagesForUser(userId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM messages WHERE recipientId IS NULL OR recipientId = ? OR senderId = ? ORDER BY createdAt ASC`;
            db.query(query, [userId, userId], (err, results) => {
                if (err) return reject(err);

                                const decryptedResults = results.map(row => ({
                    ...row,
                    content: decrypt(row.content),
                    mentions: row.mentions ? JSON.parse(row.mentions) : []
                }));
                resolve(decryptedResults);
            });
        });
    }

    getAllMessages() {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM messages ORDER BY createdAt ASC`;
            db.query(query, (err, results) => {
                if (err) return reject(err);

                                const decryptedResults = results.map(row => ({
                    ...row,
                    content: decrypt(row.content),
                    mentions: row.mentions ? JSON.parse(row.mentions) : []
                }));
                resolve(decryptedResults);
            });
        });
    }
}

module.exports = new MessageService();
