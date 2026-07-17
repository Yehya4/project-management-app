const db = require('../config/db');

class ConfigService {
    getAll() {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM configurations', (err, results) => {
                if (err) return reject(err);

                                const config = {};
                const archivedConfig = {};

                                results.forEach(row => {
                    config[row.config_key] = JSON.parse(row.config_value || '[]');
                    archivedConfig[row.config_key] = JSON.parse(row.archived_value || '[]');
                });

                                resolve({ config, archivedConfig });
            });
        });
    }

    updateList(key, list, archivedList) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE configurations SET config_value=?, archived_value=? WHERE config_key=?';
            db.query(query, [JSON.stringify(list), JSON.stringify(archivedList), key], (err) => {
                if (err) return reject(err);
                resolve({ key, list, archivedList });
            });
        });
    }
}

module.exports = new ConfigService();
