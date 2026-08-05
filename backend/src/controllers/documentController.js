const documentService = require('../services/documentService');

class DocumentController {
    async getByProjectId(req, res) {
        try {
            const { projectId } = req.params;
            const documents = await documentService.getByProjectId(projectId);
            return res.json(documents);
        } catch (err) {
            console.error("Erreur DocumentController.getByProjectId:", err);
            return res.status(500).json({ message: 'Erreur serveur.' });
        }
    }

    async create(req, res) {
        try {
            const { projectId, name, type, format, content, module } = req.body;
            if (!projectId || !name || !type || !format) {
                return res.status(400).json({ message: 'Champs obligatoires manquants.' });
            }
            
            const io = req.app.get('io');
            const doc = await documentService.create({ projectId, name, type, format, content, module }, io);
            return res.status(201).json(doc);
        } catch (err) {
            console.error("Erreur DocumentController.create:", err);
            return res.status(500).json({ message: 'Erreur lors de la création du document.' });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const io = req.app.get('io');
            const result = await documentService.delete(id, io);
            return res.json(result);
        } catch (err) {
            console.error("Erreur DocumentController.delete:", err);
            return res.status(500).json({ message: 'Erreur lors de la suppression.' });
        }
    }

    async restore(req, res) {
        try {
            const { id } = req.params;
            const io = req.app.get('io');
            const result = await documentService.restore(id, io);
            return res.json(result);
        } catch (err) {
            console.error("Erreur DocumentController.restore:", err);
            return res.status(500).json({ message: 'Erreur lors de la restauration.' });
        }
    }
}

module.exports = new DocumentController();
