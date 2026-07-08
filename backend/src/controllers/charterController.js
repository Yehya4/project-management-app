const charterService = require('../services/charterService');
const demandeService = require('../services/demandeService');

class CharterController {
    async getAll(req, res) {
        try {
            const charters = await charterService.getAll();
            res.status(200).json(charters);
        } catch (error) {
            res.status(500).json({ message: 'Erreur', error });
        }
    }

    async save(req, res) {
        try {
            const charter = await charterService.save(req.body);
            
            
            const io = req.app.get('io');
            if (io) {
                let notifType = 'info';
                let notifTitle = '';
                let notifMessage = '';
                
                if (charter.statut === 'Envoyé au Demandeur') {
                    notifTitle = 'Charte de projet envoyée';
                    notifMessage = `La charte du projet (Demande: ${charter.demandeId}) a été envoyée au Demandeur pour validation.`;
                } else if (charter.statut === 'Soumis au Sponsor') {
                    notifTitle = 'Charte de projet soumise';
                    notifMessage = `La charte du projet (Demande: ${charter.demandeId}) a été acceptée par le demandeur et soumise au Sponsor.`;
                } else if (charter.statut === 'Validé') {
                    notifTitle = 'Charte de projet validée';
                    notifMessage = `La charte du projet (Demande: ${charter.demandeId}) a été validée par le Sponsor.`;
                    notifType = 'success';
                } else if (charter.statut === 'Retourné par le Demandeur' || charter.statut === 'Retourné par le Sponsor') {
                    notifTitle = 'Charte de projet retournée';
                    notifMessage = `La charte (Demande: ${charter.demandeId}) a été retournée avec des commentaires.`;
                    notifType = 'warning';
                }
                
                if (notifTitle) {
                    let nomDemandeur = null;
                    try {
                        const demande = await demandeService.getById(charter.demandeId);
                        if (demande) {
                            nomDemandeur = demande.nomDemandeur;
                        }
                    } catch (err) {
                        console.error('Error fetching demand for charter notification:', err);
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

            res.status(200).json(charter);
        } catch (error) {
            res.status(500).json({ message: 'Erreur', error });
        }
    }

    async delete(req, res) {
        try {
            await charterService.delete(req.params.demandeId);
            res.status(200).json({ message: 'Charte supprimée' });
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la suppression', error });
        }
    }
}

module.exports = new CharterController();
