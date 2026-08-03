const db = require('./backend/src/config/db');

async function migrate() {
    const queries = [
        "ALTER TABLE projects ADD COLUMN suiviPostDeploiement TINYINT(1) DEFAULT 0;",
        "ALTER TABLE projects ADD COLUMN suiviPostDeploiementBy VARCHAR(255) DEFAULT NULL;",
        "ALTER TABLE projects ADD COLUMN suiviPostDeploiementAt VARCHAR(255) DEFAULT NULL;",
        "ALTER TABLE projects ADD COLUMN clotureBy VARCHAR(255) DEFAULT NULL;",
        "ALTER TABLE projects ADD COLUMN clotureAt VARCHAR(255) DEFAULT NULL;"
    ];

    for (let q of queries) {
        try {
            await new Promise((resolve, reject) => {
                db.query(q, (err) => {
                    if (err && err.code !== 'ER_DUP_FIELDNAME') {
                        console.error('Error on query:', q, err);
                        resolve(); // Ignore duplicates or continue
                    } else {
                        console.log('Successfully executed:', q);
                        resolve();
                    }
                });
            });
        } catch (e) {
            console.error(e);
        }
    }
    console.log('Migration complete');
    process.exit(0);
}

migrate();
