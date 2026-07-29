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

  // Add columns for test_cases
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

  // Add columns for tasks
  const tasksColumns = [
    "ALTER TABLE tasks ADD COLUMN reference VARCHAR(255)",
    "ALTER TABLE tasks ADD COLUMN objet VARCHAR(255)",
    "ALTER TABLE tasks ADD COLUMN dateDebutReel VARCHAR(255)",
    "ALTER TABLE tasks ADD COLUMN dateFinReel VARCHAR(255)",
    "ALTER TABLE tasks ADD COLUMN dateFin VARCHAR(255)",
    "ALTER TABLE tasks ADD COLUMN solutionResultat LONGTEXT",
    "ALTER TABLE tasks ADD COLUMN attachment LONGTEXT"
  ];

  tasksColumns.forEach(query => {
    connection.query(query, (err) => {
      if (err && err.code !== 'ER_DUP_FIELDNAME') console.error(`Erreur ${query}:`, err.message);
    });
  });
  // Add columns for projects (deployment + manual progress)
  const projectsColumns = [
    "ALTER TABLE projects ADD COLUMN deploymentPlanFile VARCHAR(255)",
    "ALTER TABLE projects ADD COLUMN deploymentPlanStatus VARCHAR(50) DEFAULT 'En attente'",
    "ALTER TABLE projects ADD COLUMN deploymentValidatedBy VARCHAR(255)",
    "ALTER TABLE projects ADD COLUMN deploymentValidatedAt VARCHAR(255)",
    "ALTER TABLE projects ADD COLUMN deploymentComment LONGTEXT",
    "ALTER TABLE projects ADD COLUMN manualProgress INT DEFAULT NULL"
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

  // Add columns for charters
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

  // Create project_documents table
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

  connection.release();
});

module.exports = pool;
