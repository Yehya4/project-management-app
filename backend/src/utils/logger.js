/**
 * Logger Winston — Auto Project
 * ==============================
 * Logger structuré avec :
 *   - Sortie JSON en production (facilement parsable par des outils de monitoring)
 *   - Sortie colorisée en développement
 *   - Rotation automatique des fichiers de log (logs/error.log, logs/combined.log)
 *
 * Usage :
 *   const logger = require('./utils/logger');
 *   logger.info('Message info');
 *   logger.warn('Message warning');
 *   logger.error('Message erreur', { err: error });
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

// Créer le dossier logs s'il n'existe pas
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Format commun avec timestamp
const baseFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat()
);

// Format JSON pour la production
const productionFormat = format.combine(baseFormat, format.json());

// Format colorisé pour le développement
const developmentFormat = format.combine(
  baseFormat,
  format.colorize(),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}] ${message}`;
    if (stack) log += `\n${stack}`;
    if (Object.keys(meta).length) log += `\n  ${JSON.stringify(meta, null, 2)}`;
    return log;
  })
);

const logger = createLogger({
  level: logLevel,
  format: isProduction ? productionFormat : developmentFormat,
  transports: [
    // Console (toujours actif)
    new transports.Console(),

    // Fichier : erreurs uniquement
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
      tailable: true,
    }),

    // Fichier : tous les logs
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 10,
      tailable: true,
    }),
  ],

  // Ne pas planter l'app sur une erreur de log
  exitOnError: false,
});

module.exports = logger;
