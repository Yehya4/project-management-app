const db = require('../config/db');

class EventService {
    getEventsByProjectId(projectId) {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM project_events WHERE projectId = ? ORDER BY startDate ASC', [projectId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    addEvent(eventData) {
        return new Promise((resolve, reject) => {
            const { projectId, title, description, startDate, endDate, color } = eventData;
            const query = 'INSERT INTO project_events (projectId, title, description, startDate, endDate, color) VALUES (?, ?, ?, ?, ?, ?)';
            db.query(query, [projectId, title, description, startDate, endDate, color || '#3b82f6'], (err, result) => {
                if (err) return reject(err);
                resolve({ id: result.insertId, ...eventData, color: color || '#3b82f6' });
            });
        });
    }

    updateEvent(id, eventData) {
        return new Promise((resolve, reject) => {
            const { title, description, startDate, endDate, color } = eventData;
            const query = 'UPDATE project_events SET title=?, description=?, startDate=?, endDate=?, color=? WHERE id=?';
            db.query(query, [title, description, startDate, endDate, color, id], (err) => {
                if (err) return reject(err);
                resolve({ id, ...eventData });
            });
        });
    }

    deleteEvent(id) {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM project_events WHERE id = ?', [id], (err) => {
                if (err) return reject(err);
                resolve({ id });
            });
        });
    }
}

module.exports = new EventService();
