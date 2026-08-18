const taskService = require('../services/taskService');

class TaskController {
    async getAll(req, res) {
        try {
            const tasks = await taskService.getAll();
            return res.json(tasks);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de la récupération des tâches.' });
        }
    }

    async getByProject(req, res) {
        try {
            const { projectId } = req.params;
            const tasks = await taskService.getByProjectId(projectId);
            return res.json(tasks);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de la récupération des tâches du projet.' });
        }
    }

    async create(req, res) {
        try {
            const { projectId, objet, title, description, priority, assigneeId, status, id, dateDebutReel, dateFinReel, solutionResultat, attachment, reference } = req.body;

            if (!projectId || (!title && !objet) || !priority || !status) {
                return res.status(400).json({ message: 'Champs obligatoires manquants (projectId, objet/title, priority, status).' });
            }

            let finalReference = reference;
            if (!finalReference || finalReference.trim() === '') {
                finalReference = await taskService.getNextReference();
            }
            const taskId = id || finalReference;
            const io = req.app.get('io');
            const task = await taskService.create({
                id: taskId,
                projectId,
                title: title || objet, 
                objet: objet || title,
                description,
                priority,
                assigneeId,
                status,
                reference: finalReference,
                dateDebutReel,
                dateFinReel,
                solutionResultat,
                attachment
            }, io);

            return res.status(201).json(task);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de la création de la tâche.' });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const io = req.app.get('io');
            const task = await taskService.update(id, updates, io);
            return res.json(task);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de la mise à jour de la tâche.' });
        }
    }

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ message: 'Le statut est requis.' });
            }
            const io = req.app.get('io');
            const task = await taskService.updateStatus(id, status, io);
            return res.json(task);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de la mise à jour du statut de la tâche.' });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const io = req.app.get('io');
            await taskService.delete(id, io);
            return res.json({ message: 'Tâche supprimée avec succès.' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de la suppression de la tâche.' });
        }
    }

    async restore(req, res) {
        try {
            const { id } = req.params;
            const io = req.app.get('io');
            await taskService.restore(id, io);
            return res.json({ message: 'Tâche restaurée avec succès.' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de la restauration de la tâche.' });
        }
    }
}

module.exports = new TaskController();
