const db = require('../config/db');

class DemandeService {
    parseJSONField(value, defaultValue = []) {
        if (!value) return defaultValue;
        if (Array.isArray(value)) return value; 
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : defaultValue;
        } catch {
            if (typeof value === 'string' && value.trim()) {
                return [value.trim()];
            }
            return defaultValue;
        }
    }

    parseJSONFields(row) {
        if (!row) return row;
        return {
            ...row,
            domaines:          this.parseJSONField(row.domaines),
            categoriesProjet:  this.parseJSONField(row.categoriesProjet),
            natureBesoin:      this.parseJSONField(row.natureBesoin),
            benefices:         this.parseJSONField(row.benefices),
            valideeResponsable: !!row.valideeResponsable
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

    create(demandeData, io) {
        return new Promise((resolve, reject) => {
            const year = new Date().getFullYear();
            db.query(
                `SELECT MAX(CAST(SUBSTRING_INDEX(id, '-', -1) AS UNSIGNED)) AS maxSeq
                 FROM demandes WHERE id LIKE ?`,
                [`DSI-${year}-%`],
                (err, results) => {
                if (err) return reject(err);
                const maxSeq = results[0].maxSeq || 0;
                const newId = `DSI-${year}-${String(maxSeq + 1).padStart(3, '0')}`;

                                const { 
                    nomDemandeur, fonction, domaines, categoriesProjet, 
                    contexte, description, natureBesoin, benefices, delaiSouhaite, statut, valideeResponsable,
                    service, dateFin
                } = demandeData;

                                const dateCreation = new Date().toLocaleDateString('fr-FR');
                const initialStatut = statut || 'En attente';

                                const query = `INSERT INTO demandes 
                    (id, nomDemandeur, fonction, domaines, categoriesProjet, contexte, description, natureBesoin, benefices, delaiSouhaite, dateCreation, statut, valideeResponsable, service, dateFin) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                                const values = [
                    newId, nomDemandeur, fonction, 
                    JSON.stringify(domaines || []), JSON.stringify(categoriesProjet || []), 
                    contexte, description, 
                    JSON.stringify(natureBesoin || []), JSON.stringify(benefices || []), 
                    delaiSouhaite, dateCreation, initialStatut, valideeResponsable || false,
                    service || null, dateFin || null
                ];

                db.query(query, values, (err) => {
                    if (err) return reject(err);
                    const newDemande = { id: newId, ...demandeData, statut: initialStatut, dateCreation };

                    if (io) io.emit('demande_created', newDemande);
                    if (io && initialStatut !== 'Brouillon') {
                        const notification = {
                            id: Date.now(),
                            title: 'Nouvelle demande SI',
                            message: `Une nouvelle demande (${newId}) a été soumise par ${nomDemandeur || 'un utilisateur'}.`,
                            date: 'À l\'instant',
                            read: false,
                            type: 'info'
                        };
                        const target = io.to('role_Admin').to('role_Sponsor').to('role_Project Manager');
                        if (nomDemandeur) {
                            target.to(`name_${nomDemandeur}`);
                        }
                        target.emit('new_notification', notification);
                    }

                    resolve(newDemande);
                });
            });
        });
    }

    update(id, demandeData, io) {
        return new Promise((resolve, reject) => {
            const { 
                nomDemandeur, fonction, domaines, categoriesProjet, 
                contexte, description, natureBesoin, benefices, delaiSouhaite, valideeResponsable,
                service, dateFin
            } = demandeData;

                        const query = `UPDATE demandes 
                SET nomDemandeur=?, fonction=?, domaines=?, categoriesProjet=?, contexte=?, description=?, natureBesoin=?, benefices=?, delaiSouhaite=?, valideeResponsable=?, service=?, dateFin=?
                WHERE id=?`;

                        const values = [
                nomDemandeur, fonction, 
                JSON.stringify(domaines || []), JSON.stringify(categoriesProjet || []), 
                contexte, description, 
                JSON.stringify(natureBesoin || []), JSON.stringify(benefices || []), 
                delaiSouhaite, valideeResponsable || false, service || null, dateFin || null, id
            ];

            db.query(query, values, (err) => {
                if (err) return reject(err);
                const updatedDemande = { id, ...demandeData };
                if (io) io.emit('demande_updated', updatedDemande);
                resolve(updatedDemande);
            });
        });
    }

    updateStatus(id, statut, io) {
        return new Promise((resolve, reject) => {
            db.query('UPDATE demandes SET statut = ? WHERE id = ?', [statut, id], async (err) => {
                if (err) return reject(err);
                const result = { id, statut };

                                if (io) {
                    let nomDemandeur = null;
                    try {
                        const demande = await this.getById(id);
                        if (demande) {
                            nomDemandeur = demande.nomDemandeur;
                        }
                    } catch (err) {
                        console.error(err);
                    }

                    let notification = null;
                    if (statut === 'En attente') {
                        notification = {
                            id: Date.now(),
                            title: 'Demande soumise',
                            message: `La demande (${id}) a été soumise et est en attente.`,
                            date: 'À l\'instant',
                            read: false,
                            type: 'info'
                        };
                    } else if (statut === 'Acceptée' || statut === 'Refusée') {
                        notification = {
                            id: Date.now(),
                            title: `Demande ${statut}`,
                            message: `La demande (${id}) a été ${statut.toLowerCase()}.`,
                            date: 'À l\'instant',
                            read: false,
                            type: statut === 'Acceptée' ? 'success' : 'warning'
                        };
                    }

                    if (notification) {
                        const target = io.to('role_Admin').to('role_Sponsor').to('role_Project Manager');
                        if (nomDemandeur) {
                            target.to(`name_${nomDemandeur}`);
                        }
                        target.emit('new_notification', notification);
                    }
                    
                    io.emit('demande_updated', { id, statut });
                }

                resolve(result);
            });
        });
    }

    delete(id, io) {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM demandes WHERE id = ?', [id], (err) => {
                if (err) return reject(err);
                if (io) io.emit('demande_deleted', { id });
                resolve({ id });
            });
        });
    }
}

module.exports = new DemandeService();
