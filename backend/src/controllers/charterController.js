const charterService = require('../services/charterService');

class CharterController {
    async getAll(req, res) {
        try {
            const charters = await charterService.getAll();
            return res.status(200).json(charters);
        } catch (error) {
            return res.status(500).json({ message: 'Erreur', error });
        }
    }

    async save(req, res) {
        try {
            const io = req.app.get('io');
            const charter = await charterService.save(req.body, io);
            return res.status(200).json(charter);
        } catch (error) {
            console.error('Erreur dans charterController.save:', error);
            return res.status(500).json({ message: 'Erreur', error: error.message || error });
        }
    }

    async delete(req, res) {
        try {
            const io = req.app.get('io');
            await charterService.delete(req.params.demandeId, io);
            return res.status(200).json({ message: 'Charte supprimée' });
        } catch (error) {
            return res.status(500).json({ message: 'Erreur lors de la suppression', error });
        }
    }
}

module.exports = new CharterController();
