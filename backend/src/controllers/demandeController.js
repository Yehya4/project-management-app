const demandeService = require('../services/demandeService');

class DemandeController {
    async getAll(req, res) {
        try {
            const demandes = await demandeService.getAll();
            return res.status(200).json(demandes);
        } catch (error) {
            return res.status(500).json({ message: 'Erreur lors de la récupération des demandes', error });
        }
    }

    async getById(req, res) {
        try {
            const demande = await demandeService.getById(req.params.id);
            if (!demande) {
                return res.status(404).json({ message: 'Demande non trouvée' });
            }
            return res.status(200).json(demande);
        } catch (error) {
            return res.status(500).json({ message: 'Erreur serveur', error });
        }
    }

    async create(req, res) {
        try {
            const io = req.app.get('io');
            const newDemande = await demandeService.create(req.body, io);
            return res.status(201).json(newDemande);
        } catch (error) {
            console.error("Erreur backend creation demande:", error);
            return res.status(500).json({ message: 'Erreur lors de la création', error: error.message || error });
        }
    }

    async update(req, res) {
        try {
            const io = req.app.get('io');
            const updatedDemande = await demandeService.update(req.params.id, req.body, io);
            return res.status(200).json(updatedDemande);
        } catch (error) {
            return res.status(500).json({ message: 'Erreur lors de la mise à jour', error });
        }
    }

    async updateStatus(req, res) {
        try {
            const io = req.app.get('io');
            const result = await demandeService.updateStatus(req.params.id, req.body.statut, io);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: 'Erreur lors de la mise à jour', error });
        }
    }

    async delete(req, res) {
        try {
            const io = req.app.get('io');
            await demandeService.delete(req.params.id, io);
            return res.status(200).json({ message: 'Demande supprimée' });
        } catch (error) {
            return res.status(500).json({ message: 'Erreur lors de la suppression', error });
        }
    }

    async restore(req, res) {
        try {
            const io = req.app.get('io');
            await demandeService.restore(req.params.id, io);
            return res.status(200).json({ message: 'Demande restaurée' });
        } catch (error) {
            return res.status(500).json({ message: 'Erreur lors de la restauration', error });
        }
    }
}

module.exports = new DemandeController();
