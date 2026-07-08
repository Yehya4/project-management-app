const configService = require('../services/configService');

class ConfigController {
    async getAll(req, res) {
        try {
            const data = await configService.getAll();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: 'Erreur', error });
        }
    }

    async update(req, res) {
        try {
            const key = req.params.key;
            const { list, archivedList } = req.body;
            
            const result = await configService.updateList(key, list || [], archivedList || []);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Erreur', error });
        }
    }
}

module.exports = new ConfigController();
