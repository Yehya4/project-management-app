const configService = require('../services/configService');

class ConfigController {
    async getAll(req, res) {
        try {
            const data = await configService.getAll();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ message: 'Erreur', error });
        }
    }

    async update(req, res) {
        try {
            const { key } = req.params;
            const { list, archivedList } = req.body;
            const result = await configService.updateList(key, list || [], archivedList || []);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: 'Erreur', error });
        }
    }
}

module.exports = new ConfigController();
