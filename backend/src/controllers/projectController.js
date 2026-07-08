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
            const formatted = projects.map(p => ({...p, status: p.statut}));
            res.status(200).json(formatted);
        } catch (error) {
            res.status(500).json({ message: 'Erreur', error });
        }
    }

    async create(req, res) {
        try {
            const newProject = await projectService.create(req.body);
            res.status(201).json(newProject);
        } catch (error) {
            res.status(500).json({ message: 'Erreur', error });
        }
    }

    async updateStatus(req, res) {
        try {
            const result = await projectService.updateStatus(req.params.id, req.body.status || req.body.statut);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Erreur', error });
        }
    }

    async update(req, res) {
        try {
            const result = await projectService.update(req.params.id, req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Erreur', error });
        }
    }

    async delete(req, res) {
        try {
            await projectService.delete(req.params.id);
            res.status(200).json({ message: 'Projet supprimé' });
        } catch (error) {
            res.status(500).json({ message: 'Erreur', error });
        }
    }
}

module.exports = new ProjectController();
