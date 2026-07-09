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
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la récupération des projets', error });
        }
    }

    async create(req, res) {
        try {
            const newProject = await projectService.create(req.body);
            const io = req.app.get('io');
            if (io) {
                io.emit('project_updated', newProject);
            }
            res.status(201).json(newProject);
        } catch (error) {
            res.status(500).json({ message: 'Erreur', error });
        }
    }

    async updateStatus(req, res) {
        try {
            const status = req.body.status || req.body.statut;
            const result = await projectService.updateStatus(req.params.id, status);
            const io = req.app.get('io');
            if (io) {
                const project = await projectService.getById(req.params.id);
                if (project) {
                    io.emit('project_updated', project);
                }
            }
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Erreur', error });
        }
    }

    async update(req, res) {
        try {
            const result = await projectService.update(req.params.id, req.body);
            const io = req.app.get('io');
            
            // Check and update project status dynamically based on rules (backlog/architecture validation and tasks)
            const updatedProject = await projectService.autoUpdateStatus(req.params.id, io);
            
            // If the status did not change, emit anyway so documents validation updates in real-time
            if (!updatedProject && io) {
                const project = await projectService.getById(req.params.id);
                if (project) {
                    io.emit('project_updated', project);
                }
            }
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
