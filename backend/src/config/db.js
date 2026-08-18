const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

pool.getConnection((error, connection) => {
  if (error) {
    console.error("Erreur de connexion MySQL :", error.message);
    return;
  }

  console.log("Connexion réussie à MySQL");

  connection.query(
    "ALTER TABLE demandes ADD COLUMN valideeResponsable BOOLEAN DEFAULT FALSE",
    (err) => {
      if (err && err.code !== 'ER_DUP_FIELDNAME') console.error("Erreur ajout valideeResponsable:", err.message);
    }
  );
  connection.query(
    "ALTER TABLE demandes ADD COLUMN service VARCHAR(255)",
    (err) => {
      if (err && err.code !== 'ER_DUP_FIELDNAME') console.error("Erreur ajout service:", err.message);
    }
  );
  connection.query(
    "ALTER TABLE demandes ADD COLUMN dateFin VARCHAR(255)",
    (err) => {
      if (err && err.code !== 'ER_DUP_FIELDNAME') console.error("Erreur ajout dateFin:", err.message);
    }
  );

  
  const testCasesColumns = [
    "ALTER TABLE test_cases ADD COLUMN priority VARCHAR(20) DEFAULT 'Moyenne'",
    "ALTER TABLE test_cases ADD COLUMN assignedTo VARCHAR(255)",
    "ALTER TABLE test_cases ADD COLUMN attachment LONGTEXT",
    "ALTER TABLE test_cases ADD COLUMN profile VARCHAR(255)",
    "ALTER TABLE test_cases ADD COLUMN rubrique VARCHAR(255)"
  ];

  testCasesColumns.forEach(query => {
    connection.query(query, (err) => {
      if (err && err.code !== 'ER_DUP_FIELDNAME') console.error(`Erreur ${query}:`, err.message);
    });
  });

  
  const tasksColumns = [
    "ALTER TABLE tasks ADD COLUMN reference VARCHAR(255)",
    "ALTER TABLE tasks ADD COLUMN objet VARCHAR(255)",
    "ALTER TABLE tasks ADD COLUMN dateDebutReel VARCHAR(255)",
    "ALTER TABLE tasks ADD COLUMN dateFinReel VARCHAR(255)",
    "ALTER TABLE tasks ADD COLUMN dateFin VARCHAR(255)",
    "ALTER TABLE tasks ADD COLUMN solutionResultat LONGTEXT",
    "ALTER TABLE tasks ADD COLUMN attachment LONGTEXT"
  ];

  const deduplicateReferencesQuery = `
    UPDATE tasks 
    SET reference = CONCAT(reference, '-', id) 
    WHERE reference IN (
      SELECT ref FROM (
        SELECT reference as ref FROM tasks GROUP BY reference HAVING COUNT(*) > 1
      ) as temp
    )
  `;

  connection.query(deduplicateReferencesQuery, (err) => {
    if (err) console.error("Erreur deduplication des references:", err.message);
    else {
      connection.query("ALTER TABLE tasks ADD UNIQUE INDEX unique_reference (reference)", (err) => {
        if (err && err.code !== 'ER_DUP_KEYNAME') console.error("Erreur ajout contrainte UNIQUE reference:", err.message);
      });
    }
  });

  tasksColumns.forEach(query => {
    connection.query(query, (err) => {
      if (err && err.code !== 'ER_DUP_FIELDNAME') console.error(`Erreur ${query}:`, err.message);
    });
  });
  
  const projectsColumns = [
    "ALTER TABLE projects ADD COLUMN deploymentPlanFile VARCHAR(255)",
    "ALTER TABLE projects ADD COLUMN deploymentPlanStatus VARCHAR(50) DEFAULT 'En attente'",
    "ALTER TABLE projects ADD COLUMN deploymentValidatedBy VARCHAR(255)",
    "ALTER TABLE projects ADD COLUMN deploymentValidatedAt VARCHAR(255)",
    "ALTER TABLE projects ADD COLUMN deploymentComment LONGTEXT",
    "ALTER TABLE projects ADD COLUMN manualProgress INT DEFAULT NULL",
    "ALTER TABLE projects ADD COLUMN suiviPostDeploiement TINYINT(1) DEFAULT 0",
    "ALTER TABLE projects ADD COLUMN suiviPostDeploiementBy VARCHAR(255)",
    "ALTER TABLE projects ADD COLUMN suiviPostDeploiementAt VARCHAR(255)",
    "ALTER TABLE projects ADD COLUMN clotureBy VARCHAR(255)",
    "ALTER TABLE projects ADD COLUMN clotureAt VARCHAR(255)"
  ];

  projectsColumns.forEach(query => {
    connection.query(query, (err) => {
      if (err && err.code !== 'ER_DUP_FIELDNAME') console.error(`Erreur ${query}:`, err.message);
    });
  });
  connection.query(
    "DELETE FROM demandes WHERE LOWER(contexte) LIKE '%test%' OR LOWER(description) LIKE '%test%' OR LOWER(nomDemandeur) LIKE '%test%'",
    (err) => {
      if (err) console.error("Erreur suppression tests:", err.message);
      else console.log("Demandes de test supprimées.");
    }
  );

  
  const chartersColumns = [
    "ALTER TABLE charters ADD COLUMN categoriesProjet VARCHAR(255)",
    "ALTER TABLE charters ADD COLUMN service VARCHAR(255)",
    "ALTER TABLE charters ADD COLUMN dateFin VARCHAR(255)"
  ];

  chartersColumns.forEach(query => {
    connection.query(query, (err) => {
      if (err && err.code !== 'ER_DUP_FIELDNAME') console.error(`Erreur ${query}:`, err.message);
    });
  });

  
  connection.query(
    `CREATE TABLE IF NOT EXISTS project_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      projectId INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      format VARCHAR(50) NOT NULL,
      content LONGTEXT,
      module VARCHAR(50),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) console.error("Erreur création project_documents:", err.message);
    }
  );

  
  const defaultConfigs = [
    { key: 'categories', value: ['Nouveau projet', 'Amélioration', 'Maintenance', 'Urgent'] },
    { key: 'categoriesProjet', value: ['Nouveau projet', 'Amélioration', 'Maintenance', 'Urgent'] },
    { key: 'services', value: ['DSI', 'RH', 'Finance', 'Marketing'] },
    { key: 'servicesProjet', value: ['DSI', 'RH', 'Finance', 'Marketing'] }
  ];

  defaultConfigs.forEach(config => {
    connection.query(
      `SELECT config_key, config_value FROM configurations WHERE config_key = ?`,
      [config.key],
      (err, results) => {
        if (err) {
          console.error(`Erreur vérification config ${config.key}:`, err.message);
          return;
        }
        const defaultVals = JSON.stringify(config.value);
        if (!results || results.length === 0) {
          // Row doesn't exist – insert it
          connection.query(
            `INSERT INTO configurations (config_key, config_value, archived_value) VALUES (?, ?, '[]')`,
            [config.key, defaultVals],
            (err2) => {
              if (err2) {
                console.error(`Erreur insertion config ${config.key}:`, err2.message);
              } else {
                console.log(`Configuration par défaut '${config.key}' insérée.`);
              }
            }
          );
        } else {
          // Row exists – update only if the list is empty
          let currentVal = [];
          try { currentVal = JSON.parse(results[0].config_value || '[]'); } catch (e) {}
          if (!Array.isArray(currentVal) || currentVal.length === 0) {
            connection.query(
              `UPDATE configurations SET config_value = ? WHERE config_key = ?`,
              [defaultVals, config.key],
              (err2) => {
                if (err2) {
                  console.error(`Erreur mise à jour config ${config.key}:`, err2.message);
                } else {
                  console.log(`Configuration '${config.key}' mise à jour avec les valeurs par défaut.`);
                }
              }
            );
          }
        }
      }
    );
  });

  
  const archiveColumns = [
    "ALTER TABLE demandes ADD COLUMN is_archived TINYINT(1) DEFAULT 0",
    "ALTER TABLE projects ADD COLUMN is_archived TINYINT(1) DEFAULT 0",
    "ALTER TABLE tasks ADD COLUMN is_archived TINYINT(1) DEFAULT 0",
    "ALTER TABLE test_cases ADD COLUMN is_archived TINYINT(1) DEFAULT 0",
    "ALTER TABLE project_events ADD COLUMN is_archived TINYINT(1) DEFAULT 0",
    "ALTER TABLE project_documents ADD COLUMN is_archived TINYINT(1) DEFAULT 0",
    "ALTER TABLE charters ADD COLUMN is_archived TINYINT(1) DEFAULT 0"
  ];

  archiveColumns.forEach(query => {
    connection.query(query, (err) => {
      if (err && err.code !== 'ER_DUP_FIELDNAME') console.error(`Erreur ${query}:`, err.message);
    });
  });

  connection.release();
});

module.exports = pool;
