const projectService = require('../services/projectService');

class ProjectController {
    async getAll(req, res) {
        try {
            let projects;
            if (req.user && (req.user.role === 'Developer' || req.user.role === 'Tester')) {
                projects = await projectService.getProjectsByUserId(req.user.id);
            } else {
                projects = await projectService.getAll();
            }
            return res.status(200).json(projects);
        } catch (error) {
            return res.status(500).json({ message: 'Erreur lors de la récupération des projets', error });
        }
    }

    async create(req, res) {
        try {
            const io = req.app.get('io');
            const newProject = await projectService.create(req.body, io);
            return res.status(201).json(newProject);
        } catch (error) {
            console.error('Erreur dans projectController.create:', error);
            return res.status(500).json({ message: 'Erreur', error: error.message || error });
        }
    }

    async updateStatus(req, res) {
        try {
            const status = req.body.status || req.body.statut;
            const io = req.app.get('io');
            const result = await projectService.updateStatus(req.params.id, status, io);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: 'Erreur', error });
        }
    }

    async update(req, res) {
        try {
            const io = req.app.get('io');
            const result = await projectService.update(req.params.id, req.body, io);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: 'Erreur', error });
        }
    }

    async updateProgress(req, res) {
        try {
            const io = req.app.get('io');
            const { manualProgress } = req.body;
            if (manualProgress === undefined || manualProgress === null) {
                return res.status(400).json({ message: 'manualProgress requis' });
            }
            const result = await projectService.updateProgress(req.params.id, manualProgress, io);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: 'Erreur mise à jour progression', error });
        }
    }

    async delete(req, res) {
        try {
            await projectService.delete(req.params.id);
            return res.status(200).json({ message: 'Projet supprimé' });
        } catch (error) {
            return res.status(500).json({ message: 'Erreur', error });
        }
    }
}

module.exports = new ProjectController();
