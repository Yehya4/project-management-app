const db = require('../config/db');

class CharterService {
    getAll() {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM charters ORDER BY created_at DESC', (err, results) => {
                if (err) return reject(err);
                resolve(results.map(row => ({
                    ...row,
                    commentaires: row.commentaires ? JSON.parse(row.commentaires) : []
                })));
            });
        });
    }

    getByDemandeId(demandeId) {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM charters WHERE demandeId = ?', [demandeId], (err, results) => {
                if (err) return reject(err);
                const row = results[0];
                if (row) {
                    row.commentaires = row.commentaires ? JSON.parse(row.commentaires) : [];
                    resolve(row);
                } else {
                    resolve(null);
                }
            });
        });
    }

    save(charterData) {
        return new Promise((resolve, reject) => {
            const { 
                demandeId, titre, contexte, objectifs, perimetreInclus, perimetreExclu, 
                sponsorIT, chefProjetIT, equipeIT, 
                sponsorMetier, chefProjetMetier, equipeMetier, utilisateursFinaux, 
                planCom, risques, criteresSucces, statut, commentaires
            } = charterData;
            
            db.query('SELECT id FROM charters WHERE demandeId = ?', [demandeId], (err, results) => {
                if (err) return reject(err);
                
                if (results.length > 0) {
                    const query = `UPDATE charters SET 
                        titre=?, contexte=?, objectifs=?, perimetreInclus=?, perimetreExclu=?, 
                        sponsorIT=?, chefProjetIT=?, equipeIT=?, 
                        sponsorMetier=?, chefProjetMetier=?, equipeMetier=?, utilisateursFinaux=?, 
                        planCom=?, risques=?, criteresSucces=?, statut=?, commentaires=?
                        WHERE demandeId=?`;
                    
                    const values = [
                        titre, contexte, objectifs, perimetreInclus, perimetreExclu, 
                        sponsorIT, chefProjetIT, equipeIT, 
                        sponsorMetier, chefProjetMetier, equipeMetier, utilisateursFinaux, 
                        planCom, risques, criteresSucces, statut || 'Brouillon', 
                        JSON.stringify(commentaires || []), demandeId
                    ];
                    
                    db.query(query, values, (err) => {
                        if (err) return reject(err);
                        resolve(charterData);
                    });
                } else {
                    const query = `INSERT INTO charters 
                        (demandeId, titre, contexte, objectifs, perimetreInclus, perimetreExclu, 
                        sponsorIT, chefProjetIT, equipeIT, 
                        sponsorMetier, chefProjetMetier, equipeMetier, utilisateursFinaux, 
                        planCom, risques, criteresSucces, statut, commentaires) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    
                    const values = [
                        demandeId, titre, contexte, objectifs, perimetreInclus, perimetreExclu, 
                        sponsorIT, chefProjetIT, equipeIT, 
                        sponsorMetier, chefProjetMetier, equipeMetier, utilisateursFinaux, 
                        planCom, risques, criteresSucces, statut || 'Brouillon',
                        JSON.stringify(commentaires || [])
                    ];

                    db.query(query, values, (err) => {
                        if (err) return reject(err);
                        resolve(charterData);
                    });
                }
            });
        });
    }

    delete(demandeId) {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM charters WHERE demandeId = ?', [demandeId], (err) => {
                if (err) return reject(err);
                resolve({ demandeId });
            });
        });
    }
}

module.exports = new CharterService();
