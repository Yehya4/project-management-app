/**
 * Script de migration de la base de données Auto Project
 * =======================================================
 * Ce script doit être exécuté UNE SEULE FOIS avant (ou après) un déploiement
 * pour appliquer les changements de schéma.
 *
 * Usage :
 *   node src/migrations/migrate.js
 *
 * Il est idempotent : safe à ré-exécuter si une colonne existe déjà (ER_DUP_FIELDNAME ignoré).
 */

require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
});

const IGNORABLE_ERRORS = ['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME', 'ER_TABLE_EXISTS_ERROR'];

function runQuery(sql, description) {
  return new Promise((resolve) => {
    connection.query(sql, (err) => {
      if (err) {
        if (IGNORABLE_ERRORS.includes(err.code)) {
          console.log(`  ⏭️  Ignoré (déjà appliqué) : ${description}`);
        } else {
          console.error(`  ❌ Erreur : ${description}`);
          console.error(`     ${err.message}`);
        }
      } else {
        console.log(`  ✅ OK : ${description}`);
      }
      resolve();
    });
  });
}

async function runMigrations() {
  console.log('\n🚀 Début des migrations Auto Project...\n');

  // ─── Table : demandes ────────────────────────────────────────────────────
  console.log('📦 Table: demandes');
  await runQuery("ALTER TABLE demandes ADD COLUMN valideeResponsable BOOLEAN DEFAULT FALSE", "demandes.valideeResponsable");
  await runQuery("ALTER TABLE demandes ADD COLUMN service VARCHAR(255)", "demandes.service");
  await runQuery("ALTER TABLE demandes ADD COLUMN dateFin VARCHAR(255)", "demandes.dateFin");
  await runQuery("ALTER TABLE demandes ADD COLUMN is_archived TINYINT(1) DEFAULT 0", "demandes.is_archived");

  // ─── Table : test_cases ──────────────────────────────────────────────────
  console.log('\n📦 Table: test_cases');
  await runQuery("ALTER TABLE test_cases ADD COLUMN priority VARCHAR(20) DEFAULT 'Moyenne'", "test_cases.priority");
  await runQuery("ALTER TABLE test_cases ADD COLUMN assignedTo VARCHAR(255)", "test_cases.assignedTo");
  await runQuery("ALTER TABLE test_cases ADD COLUMN attachment LONGTEXT", "test_cases.attachment");
  await runQuery("ALTER TABLE test_cases ADD COLUMN profile VARCHAR(255)", "test_cases.profile");
  await runQuery("ALTER TABLE test_cases ADD COLUMN rubrique VARCHAR(255)", "test_cases.rubrique");
  await runQuery("ALTER TABLE test_cases ADD COLUMN is_archived TINYINT(1) DEFAULT 0", "test_cases.is_archived");

  // ─── Table : tasks ───────────────────────────────────────────────────────
  console.log('\n📦 Table: tasks');
  await runQuery("ALTER TABLE tasks ADD COLUMN reference VARCHAR(255)", "tasks.reference");
  await runQuery("ALTER TABLE tasks ADD COLUMN objet VARCHAR(255)", "tasks.objet");
  await runQuery("ALTER TABLE tasks ADD COLUMN dateDebutReel VARCHAR(255)", "tasks.dateDebutReel");
  await runQuery("ALTER TABLE tasks ADD COLUMN dateFinReel VARCHAR(255)", "tasks.dateFinReel");
  await runQuery("ALTER TABLE tasks ADD COLUMN dateFin VARCHAR(255)", "tasks.dateFin");
  await runQuery("ALTER TABLE tasks ADD COLUMN solutionResultat LONGTEXT", "tasks.solutionResultat");
  await runQuery("ALTER TABLE tasks ADD COLUMN attachment LONGTEXT", "tasks.attachment");
  await runQuery("ALTER TABLE tasks ADD COLUMN is_archived TINYINT(1) DEFAULT 0", "tasks.is_archived");
  // Index unique sur reference (idempotent)
  await runQuery("ALTER TABLE tasks ADD UNIQUE INDEX unique_reference (reference)", "tasks.unique_reference index");

  // ─── Table : projects ────────────────────────────────────────────────────
  console.log('\n📦 Table: projects');
  await runQuery("ALTER TABLE projects ADD COLUMN deploymentPlanFile VARCHAR(255)", "projects.deploymentPlanFile");
  await runQuery("ALTER TABLE projects ADD COLUMN deploymentPlanStatus VARCHAR(50) DEFAULT 'En attente'", "projects.deploymentPlanStatus");
  await runQuery("ALTER TABLE projects ADD COLUMN deploymentValidatedBy VARCHAR(255)", "projects.deploymentValidatedBy");
  await runQuery("ALTER TABLE projects ADD COLUMN deploymentValidatedAt VARCHAR(255)", "projects.deploymentValidatedAt");
  await runQuery("ALTER TABLE projects ADD COLUMN deploymentComment LONGTEXT", "projects.deploymentComment");
  await runQuery("ALTER TABLE projects ADD COLUMN manualProgress INT DEFAULT NULL", "projects.manualProgress");
  await runQuery("ALTER TABLE projects ADD COLUMN suiviPostDeploiement TINYINT(1) DEFAULT 0", "projects.suiviPostDeploiement");
  await runQuery("ALTER TABLE projects ADD COLUMN suiviPostDeploiementBy VARCHAR(255)", "projects.suiviPostDeploiementBy");
  await runQuery("ALTER TABLE projects ADD COLUMN suiviPostDeploiementAt VARCHAR(255)", "projects.suiviPostDeploiementAt");
  await runQuery("ALTER TABLE projects ADD COLUMN clotureBy VARCHAR(255)", "projects.clotureBy");
  await runQuery("ALTER TABLE projects ADD COLUMN clotureAt VARCHAR(255)", "projects.clotureAt");
  await runQuery("ALTER TABLE projects ADD COLUMN is_archived TINYINT(1) DEFAULT 0", "projects.is_archived");

  // ─── Table : charters ────────────────────────────────────────────────────
  console.log('\n📦 Table: charters');
  await runQuery("ALTER TABLE charters ADD COLUMN categoriesProjet VARCHAR(255)", "charters.categoriesProjet");
  await runQuery("ALTER TABLE charters ADD COLUMN service VARCHAR(255)", "charters.service");
  await runQuery("ALTER TABLE charters ADD COLUMN dateFin VARCHAR(255)", "charters.dateFin");
  await runQuery("ALTER TABLE charters ADD COLUMN is_archived TINYINT(1) DEFAULT 0", "charters.is_archived");

  // ─── Table : project_events ──────────────────────────────────────────────
  console.log('\n📦 Table: project_events');
  await runQuery("ALTER TABLE project_events ADD COLUMN is_archived TINYINT(1) DEFAULT 0", "project_events.is_archived");

  // ─── Créer la table project_documents (si elle n'existe pas) ─────────────
  console.log('\n📦 Table: project_documents (CREATE IF NOT EXISTS)');
  await runQuery(`
    CREATE TABLE IF NOT EXISTS project_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      projectId INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      format VARCHAR(50) NOT NULL,
      content LONGTEXT,
      module VARCHAR(50),
      is_archived TINYINT(1) DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, "project_documents (CREATE IF NOT EXISTS)");

  // ─── Table : configurations — données par défaut ─────────────────────────
  console.log('\n📦 Table: configurations (données par défaut)');
  const defaultConfigs = [
    { key: 'categories', value: ['Nouveau projet', 'Amélioration', 'Maintenance', 'Urgent'] },
    { key: 'categoriesProjet', value: ['Nouveau projet', 'Amélioration', 'Maintenance', 'Urgent'] },
    { key: 'services', value: ['DSI', 'RH', 'Finance', 'Marketing'] },
    { key: 'servicesProjet', value: ['DSI', 'RH', 'Finance', 'Marketing'] },
  ];

  for (const config of defaultConfigs) {
    await new Promise((resolve) => {
      connection.query(
        'SELECT config_key, config_value FROM configurations WHERE config_key = ?',
        [config.key],
        (err, results) => {
          if (err) {
            console.error(`  ❌ Erreur vérification config ${config.key}: ${err.message}`);
            return resolve();
          }
          const defaultVals = JSON.stringify(config.value);
          if (!results || results.length === 0) {
            connection.query(
              `INSERT INTO configurations (config_key, config_value, archived_value) VALUES (?, ?, '[]')`,
              [config.key, defaultVals],
              (err2) => {
                if (err2) console.error(`  ❌ Erreur insertion config ${config.key}: ${err2.message}`);
                else console.log(`  ✅ Config '${config.key}' insérée`);
                resolve();
              }
            );
          } else {
            let currentVal = [];
            try { currentVal = JSON.parse(results[0].config_value || '[]'); } catch (e) { /* ignore */ }
            if (!Array.isArray(currentVal) || currentVal.length === 0) {
              connection.query(
                'UPDATE configurations SET config_value = ? WHERE config_key = ?',
                [defaultVals, config.key],
                (err2) => {
                  if (err2) console.error(`  ❌ Erreur mise à jour config ${config.key}: ${err2.message}`);
                  else console.log(`  ✅ Config '${config.key}' mise à jour`);
                  resolve();
                }
              );
            } else {
              console.log(`  ⏭️  Config '${config.key}' déjà présente, ignorée`);
              resolve();
            }
          }
        }
      );
    });
  }

  console.log('\n🎉 Toutes les migrations sont terminées avec succès.\n');
  connection.end();
}

connection.connect((err) => {
  if (err) {
    console.error('❌ Impossible de se connecter à MySQL:', err.message);
    process.exit(1);
  }
  console.log('✅ Connecté à MySQL');
  runMigrations().catch((e) => {
    console.error('❌ Erreur fatale lors des migrations:', e);
    connection.end();
    process.exit(1);
  });
});
