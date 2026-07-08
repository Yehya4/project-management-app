const db = require('../config/db');

class DemandeService {
    parseJSONFields(row) {
        if (!row) return row;
        return {
            ...row,
            domaines: JSON.parse(row.domaines || '[]'),
            categoriesProjet: JSON.parse(row.categoriesProjet || '[]'),
            natureBesoin: JSON.parse(row.natureBesoin || '[]'),
            benefices: JSON.parse(row.benefices || '[]')
        };
    }

    getAll() {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM demandes ORDER BY created_at DESC', (err, results) => {
                if (err) return reject(err);
                resolve(results.map(row => this.parseJSONFields(row)));
            });
        });
    }

    getById(id) {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM demandes WHERE id = ?', [id], (err, results) => {
                if (err) return reject(err);
                resolve(this.parseJSONFields(results[0]));
            });
        });
    }

    create(demandeData) {
        return new Promise((resolve, reject) => {
            db.query('SELECT COUNT(*) AS count FROM demandes', (err, results) => {
                if (err) return reject(err);
                const count = results[0].count + 1;
                const newId = `DSI-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
                
                const { 
                    nomDemandeur, fonction, domaines, categoriesProjet, 
                    contexte, description, natureBesoin, benefices, delaiSouhaite, statut 
                } = demandeData;
                
                const dateCreation = new Date().toLocaleDateString('fr-FR');
                const initialStatut = statut || 'En attente';
                
                const query = `INSERT INTO demandes 
                    (id, nomDemandeur, fonction, domaines, categoriesProjet, contexte, description, natureBesoin, benefices, delaiSouhaite, dateCreation, statut) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                
                const values = [
                    newId, nomDemandeur, fonction, 
                    JSON.stringify(domaines || []), JSON.stringify(categoriesProjet || []), 
                    contexte, description, 
                    JSON.stringify(natureBesoin || []), JSON.stringify(benefices || []), 
                    delaiSouhaite, dateCreation, initialStatut
                ];

                db.query(query, values, (err) => {
                    if (err) return reject(err);
                    resolve({ id: newId, ...demandeData, statut: initialStatut, dateCreation });
                });
            });
        });
    }

    update(id, demandeData) {
        return new Promise((resolve, reject) => {
            const { 
                nomDemandeur, fonction, domaines, categoriesProjet, 
                contexte, description, natureBesoin, benefices, delaiSouhaite 
            } = demandeData;
            
            const query = `UPDATE demandes 
                SET nomDemandeur=?, fonction=?, domaines=?, categoriesProjet=?, contexte=?, description=?, natureBesoin=?, benefices=?, delaiSouhaite=?
                WHERE id=?`;
            
            const values = [
                nomDemandeur, fonction, 
                JSON.stringify(domaines || []), JSON.stringify(categoriesProjet || []), 
                contexte, description, 
                JSON.stringify(natureBesoin || []), JSON.stringify(benefices || []), 
                delaiSouhaite, id
            ];

            db.query(query, values, (err) => {
                if (err) return reject(err);
                resolve({ id, ...demandeData });
            });
        });
    }

    updateStatus(id, statut) {
        return new Promise((resolve, reject) => {
            db.query('UPDATE demandes SET statut = ? WHERE id = ?', [statut, id], (err) => {
                if (err) return reject(err);
                resolve({ id, statut });
            });
        });
    }

    delete(id) {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM demandes WHERE id = ?', [id], (err) => {
                if (err) return reject(err);
                resolve({ id });
            });
        });
    }
}

module.exports = new DemandeService();
