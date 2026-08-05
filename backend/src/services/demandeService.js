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

                                let formattedDateFin = null;
                if (dateFin) {
                    const dStr = String(dateFin).trim();
                    if (dStr) {
                        formattedDateFin = dStr.includes('T') ? dStr.split('T')[0] : dStr;
                    }
                }

                const values = [
                    newId, nomDemandeur, fonction, 
                    JSON.stringify(domaines || []), JSON.stringify(categoriesProjet || []), 
                    contexte, description, 
                    JSON.stringify(natureBesoin || []), JSON.stringify(benefices || []), 
                    delaiSouhaite, dateCreation, initialStatut, valideeResponsable || false,
                    service || null, formattedDateFin
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
                service, dateFin, statut
            } = demandeData;

            const query = `UPDATE demandes 
                SET nomDemandeur=?, fonction=?, domaines=?, categoriesProjet=?, contexte=?, description=?, natureBesoin=?, benefices=?, delaiSouhaite=?, valideeResponsable=?, service=?, dateFin=?, statut=?
                WHERE id=?`;

            let formattedDateFin = null;
            if (dateFin) {
                const dStr = String(dateFin).trim();
                if (dStr) {
                    formattedDateFin = dStr.includes('T') ? dStr.split('T')[0] : dStr;
                }
            }

            const values = [
                nomDemandeur, fonction, 
                JSON.stringify(domaines || []), JSON.stringify(categoriesProjet || []), 
                contexte, description, 
                JSON.stringify(natureBesoin || []), JSON.stringify(benefices || []), 
                delaiSouhaite, valideeResponsable || false, service || null, formattedDateFin, statut || 'En attente', id
            ];

            db.query(query, values, (err) => {
                if (err) return reject(err);
                const updatedDemande = { id, ...demandeData, statut: statut || 'En attente' };
                if (io) {
                    io.emit('demande_updated', updatedDemande);
                    if (statut === 'En cours') {
                        const notification = {
                            id: Date.now(),
                            title: 'Nouvelle demande SI',
                            message: `Une nouvelle demande (${id}) a été soumise par ${nomDemandeur || 'un utilisateur'}.`,
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
                }
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
                    if (statut === 'En attente' || statut === 'En cours') {
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

                if (statut === 'Acceptée') {
                    try {
                        db.query('SELECT * FROM projects WHERE demandeId = ?', [id], (pErr, pResults) => {
                            if (!pErr && (!pResults || pResults.length === 0)) {
                                const projectService = require('./projectService');
                                this.getById(id).then(demandeObj => {
                                    const projName = `Projet (${id})`;
                                    projectService.create({
                                        nom: projName,
                                        chefProjet: 'Project Manager (PM)',
                                        status: 'Initiation',
                                        description: demandeObj?.description || '',
                                        demandeId: id
                                    }, io).catch(console.error);
                                }).catch(console.error);
                            }
                        });
                    } catch (pEx) {
                        console.error('Erreur auto-création projet:', pEx);
                    }
                }

                resolve(result);
            });
        });
    }

    delete(id, io) {
        return new Promise((resolve, reject) => {
            db.query('UPDATE demandes SET is_archived = 1 WHERE id = ?', [id], (err) => {
                if (err) return reject(err);
                if (io) io.emit('demande_deleted', { id, archived: true });
                resolve({ id });
            });
        });
    }

    restore(id, io) {
        return new Promise((resolve, reject) => {
            db.query('UPDATE demandes SET is_archived = 0 WHERE id = ?', [id], (err) => {
                if (err) return reject(err);
                if (io) io.emit('demande_restored', { id });
                resolve({ id });
            });
        });
    }
}

module.exports = new DemandeService();
