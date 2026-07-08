const demandeService = require('../services/demandeService');

class DemandeController {
    async getAll(req, res) {
        try {
            const demandes = await demandeService.getAll();
            res.status(200).json(demandes);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la récupération des demandes', error });
        }
    }

    async getById(req, res) {
        try {
            const demande = await demandeService.getById(req.params.id);
            if (demande) {
                res.status(200).json(demande);
            } else {
                res.status(404).json({ message: 'Demande non trouvée' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Erreur serveur', error });
        }
    }

    async create(req, res) {
        try {
            const newDemande = await demandeService.create(req.body);
            
            
            const io = req.app.get('io');
            if (io && newDemande.statut !== 'Brouillon') {
                const notification = {
                    id: Date.now(),
                    title: 'Nouvelle demande SI',
                    message: `Une nouvelle demande (${newDemande.id}) a été soumise par ${newDemande.nomDemandeur || 'un utilisateur'}.`,
                    date: 'À l\'instant',
                    read: false,
                    type: 'info'
                };
                const target = io.to('role_Admin').to('role_Sponsor').to('role_Project Manager');
                if (newDemande.nomDemandeur) {
                    target.to(`name_${newDemande.nomDemandeur}`);
                }
                target.emit('new_notification', notification);
            }

            res.status(201).json(newDemande);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la création', error });
        }
    }

    async update(req, res) {
        try {
            const updatedDemande = await demandeService.update(req.params.id, req.body);
            res.status(200).json(updatedDemande);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la mise à jour', error });
        }
    }

    async updateStatus(req, res) {
        try {
            const result = await demandeService.updateStatus(req.params.id, req.body.statut);
            
            
            const io = req.app.get('io');
            if (io) {
                let nomDemandeur = null;
                try {
                    const demande = await demandeService.getById(req.params.id);
                    if (demande) {
                        nomDemandeur = demande.nomDemandeur;
                    }
                } catch (err) {
                    console.error('Error fetching demand for notification:', err);
                }

                let notification = null;
                if (req.body.statut === 'En attente') {
                     notification = {
                        id: Date.now(),
                        title: 'Demande soumise',
                        message: `La demande (${req.params.id}) a été soumise et est en attente.`,
                        date: 'À l\'instant',
                        read: false,
                        type: 'info'
                    };
                } else if (req.body.statut === 'Acceptée' || req.body.statut === 'Refusée') {
                    notification = {
                        id: Date.now(),
                        title: `Demande ${req.body.statut}`,
                        message: `La demande (${req.params.id}) a été ${req.body.statut.toLowerCase()}.`,
                        date: 'À l\'instant',
                        read: false,
                        type: req.body.statut === 'Acceptée' ? 'success' : 'warning'
                    };
                }

                if (notification) {
                    const target = io.to('role_Admin').to('role_Sponsor').to('role_Project Manager');
                    if (nomDemandeur) {
                        target.to(`name_${nomDemandeur}`);
                    }
                    target.emit('new_notification', notification);
                }
            }

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la mise à jour', error });
        }
    }

    async delete(req, res) {
        try {
            await demandeService.delete(req.params.id);
            res.status(200).json({ message: 'Demande supprimée' });
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la suppression', error });
        }
    }
}

module.exports = new DemandeController();
