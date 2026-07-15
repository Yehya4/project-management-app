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
  
  // Ensure the column exists
  connection.query(
    "ALTER TABLE demandes ADD COLUMN valideeResponsable BOOLEAN DEFAULT FALSE",
    (err) => {
      if (err) {
        // Ignorer l'erreur si la colonne existe déjà (ER_DUP_FIELDNAME)
        if (err.code !== 'ER_DUP_FIELDNAME') {
          console.error("Erreur lors de l'ajout de la colonne valideeResponsable:", err.message);
        }
      } else {
        console.log("Colonne valideeResponsable ajoutée avec succès à la table demandes.");
      }
    }
  );

  connection.release();
});

module.exports = pool;
