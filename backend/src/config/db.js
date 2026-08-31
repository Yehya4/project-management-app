const mysql = require("mysql2");
const logger = require("../utils/logger");

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
    logger.error("Erreur de connexion MySQL : " + error.message);
    return;
  }
  logger.info("Connexion réussie à MySQL (pool)");
  connection.release();
});

module.exports = pool;
