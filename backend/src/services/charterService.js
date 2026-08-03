const db = require('../config/db');

class CharterService {
    getAll() {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM charters ORDER BY created_at DESC', (err, results) => {
                if (err) return reject(err);
                resolve(results.map(row => {
                    let parsedCategories = [];
                    if (row.categoriesProjet) {
                        try {
                            parsedCategories = JSON.parse(row.categoriesProjet);
                        } catch (e) {
                            parsedCategories = row.categoriesProjet.split(',').map(s => s.trim());
                        }
                    }
                    return {
                        ...row,
                        commentaires: row.commentaires ? JSON.parse(row.commentaires) : [],
                        categoriesProjet: parsedCategories
                    };
                }));
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
                    if (row.categoriesProjet) {
                        try {
                            row.categoriesProjet = JSON.parse(row.categoriesProjet);
                        } catch (e) {
                            row.categoriesProjet = row.categoriesProjet.split(',').map(s => s.trim());
                        }
                    } else {
                        row.categoriesProjet = [];
                    }
                    resolve(row);
                } else {
                    resolve(null);
                }
            });
        });
    }

    async save(charterData, io) {
        const { 
            demandeId, titre, contexte, objectifs, perimetreInclus, perimetreExclu, 
            sponsorIT, chefProjetIT, equipeIT, 
            sponsorMetier, chefProjetMetier, equipeMetier, utilisateursFinaux, 
            planCom, risques, criteresSucces, statut, commentaires,
            categoriesProjet, service, dateFin
        } = charterData;

        const catProjetStr = categoriesProjet ? (Array.isArray(categoriesProjet) ? JSON.stringify(categoriesProjet) : categoriesProjet) : null;

        await new Promise((resolve, reject) => {
            db.query('SELECT id FROM charters WHERE demandeId = ?', [demandeId], (err, results) => {
                if (err) return reject(err);

                if (results.length > 0) {
                    const query = `UPDATE charters SET 
                        titre=?, contexte=?, objectifs=?, perimetreInclus=?, perimetreExclu=?, 
                        sponsorIT=?, chefProjetIT=?, equipeIT=?, 
                        sponsorMetier=?, chefProjetMetier=?, equipeMetier=?, utilisateursFinaux=?, 
                        planCom=?, risques=?, criteresSucces=?, statut=?, commentaires=?,
                        categoriesProjet=?, service=?, dateFin=?
                        WHERE demandeId=?`;

                    const values = [
                        titre, contexte, objectifs, perimetreInclus, perimetreExclu, 
                        sponsorIT, chefProjetIT, equipeIT, 
                        sponsorMetier, chefProjetMetier, equipeMetier, utilisateursFinaux, 
                        planCom, risques, criteresSucces, statut || 'Brouillon', 
                        JSON.stringify(commentaires || []), 
                        catProjetStr, service || null, dateFin || null, 
                        demandeId
                    ];

                    db.query(query, values, (err) => {
                        if (err) return reject(err);
                        if (io) io.emit('charter_updated', charterData);
                        resolve();
                    });
                } else {
                    const query = `INSERT INTO charters 
                        (demandeId, titre, contexte, objectifs, perimetreInclus, perimetreExclu, 
                        sponsorIT, chefProjetIT, equipeIT, 
                        sponsorMetier, chefProjetMetier, equipeMetier, utilisateursFinaux, 
                        planCom, risques, criteresSucces, statut, commentaires, categoriesProjet, service, dateFin) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                    const values = [
                        demandeId, titre, contexte, objectifs, perimetreInclus, perimetreExclu, 
                        sponsorIT, chefProjetIT, equipeIT, 
                        sponsorMetier, chefProjetMetier, equipeMetier, utilisateursFinaux, 
                        planCom, risques, criteresSucces, statut || 'Brouillon',
                        JSON.stringify(commentaires || []),
                        catProjetStr, service || null, dateFin || null
                    ];

                    db.query(query, values, (err) => {
                        if (err) return reject(err);
                        if (io) io.emit('charter_created', charterData);
                        resolve();
                    });
                }
            });
        });

        if (io) {
            let notifType = 'info';
            let notifTitle = '';
            let notifMessage = '';

                        if (statut === 'Envoyé au Demandeur') {
                notifTitle = 'Charte de projet envoyée';
                notifMessage = `La charte du projet (Demande: ${demandeId}) a été envoyée au Demandeur pour validation.`;
            } else if (statut === 'Soumis au Sponsor') {
                notifTitle = 'Charte de projet soumise';
                notifMessage = `La charte du projet (Demande: ${demandeId}) a été acceptée par le demandeur et soumise au Sponsor.`;
            } else if (statut === 'Validé') {
                notifTitle = 'Charte de projet validée';
                notifMessage = `La charte du projet (Demande: ${demandeId}) a été validée par le Sponsor.`;
                notifType = 'success';
            } else if (statut === 'Retourné par le Demandeur' || statut === 'Retourné par le Sponsor') {
                notifTitle = 'Charte de projet retournée';
                notifMessage = `La charte (Demande: ${demandeId}) a été retournée avec des commentaires.`;
                notifType = 'warning';
            }

                        if (notifTitle) {
                let nomDemandeur = null;
                try {
                    const demandeService = require('./demandeService');
                    const demande = await demandeService.getById(demandeId);
                    if (demande) {
                        nomDemandeur = demande.nomDemandeur;
                    }
                } catch (err) {
                    console.error(err);
                }

                const notification = {
                    id: Date.now(),
                    title: notifTitle,
                    message: notifMessage,
                    date: 'À l\'instant',
                    read: false,
                    type: notifType
                };

                const target = io.to('role_Admin').to('role_Sponsor').to('role_Project Manager');
                if (nomDemandeur) {
                    target.to(`name_${nomDemandeur}`);
                }
                target.emit('new_notification', notification);
            }
        }

        return charterData;
    }

    delete(demandeId, io) {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM charters WHERE demandeId = ?', [demandeId], (err) => {
                if (err) return reject(err);
                if (io) io.emit('charter_deleted', { demandeId });
                resolve({ demandeId });
            });
        });
    }
}

module.exports = new CharterService();
