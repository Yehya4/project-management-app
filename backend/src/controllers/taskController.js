const taskService = require('../services/taskService');
const projectService = require('../services/projectService');

class TaskController {
    async getAll(req, res) {
        try {
            const tasks = await taskService.getAll();
            res.json(tasks);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            res.status(500).json({ message: 'Erreur lors de la récupération des tâches.' });
        }
    }

    async getByProject(req, res) {
        try {
            const { projectId } = req.params;
            const tasks = await taskService.getByProjectId(projectId);
            res.json(tasks);
        } catch (err) {
            console.error('Error fetching tasks by project:', err);
            res.status(500).json({ message: 'Erreur lors de la récupération des tâches du projet.' });
        }
    }

    async create(req, res) {
        try {
            const { projectId, title, description, priority, assigneeId, status, id } = req.body;
            
            if (!projectId || !title || !priority || !status) {
                return res.status(400).json({ message: 'Champs obligatoires manquants (projectId, title, priority, status).' });
            }

            const taskId = id || `TASK-${Date.now()}`;
            const task = await taskService.create({
                id: taskId,
                projectId,
                title,
                description,
                priority,
                assigneeId,
                status
            });

            const io = req.app.get('io');
            if (io) {
                io.emit('task_created', task);
            }
            await projectService.autoUpdateStatus(projectId, io);

            res.status(201).json(task);
        } catch (err) {
            console.error('Error creating task:', err);
            res.status(500).json({ message: 'Erreur lors de la création de la tâche.' });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const task = await taskService.update(id, updates);
            const taskData = await taskService.getById(id);
            const io = req.app.get('io');
            if (io) {
                io.emit('task_updated', taskData);
            }
            if (taskData) {
                await projectService.autoUpdateStatus(taskData.projectId, io);
            }
            res.json(task);
        } catch (err) {
            console.error('Error updating task:', err);
            res.status(500).json({ message: 'Erreur lors de la mise à jour de la tâche.' });
        }
    }

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ message: 'Le statut est requis.' });
            }
            const task = await taskService.updateStatus(id, status);
            const taskData = await taskService.getById(id);
            const io = req.app.get('io');
            if (io) {
                io.emit('task_updated', taskData);
            }
            if (taskData) {
                await projectService.autoUpdateStatus(taskData.projectId, io);
            }
            res.json(task);
        } catch (err) {
            console.error('Error updating task status:', err);
            res.status(500).json({ message: 'Erreur lors de la mise à jour du statut de la tâche.' });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const taskData = await taskService.getById(id);
            await taskService.delete(id);
            const io = req.app.get('io');
            if (io) {
                io.emit('task_deleted', { id });
            }
            if (taskData) {
                await projectService.autoUpdateStatus(taskData.projectId, io);
            }
            res.json({ message: 'Tâche supprimée avec succès.' });
        } catch (err) {
            console.error('Error deleting task:', err);
            res.status(500).json({ message: 'Erreur lors de la suppression de la tâche.' });
        }
    }
}

module.exports = new TaskController();
