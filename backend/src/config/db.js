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

  connection.query(
    "DELETE FROM demandes WHERE LOWER(contexte) LIKE '%test%' OR LOWER(description) LIKE '%test%' OR LOWER(nomDemandeur) LIKE '%test%'",
    (err) => {
      if (err) console.error("Erreur suppression tests:", err.message);
      else console.log("Demandes de test supprimées.");
    }
  );

  connection.release();
});

module.exports = pool;
