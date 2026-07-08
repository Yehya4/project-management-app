const userService = require('../services/userService');

class UserController {
    async getAll(req, res) {
        try {
            const users = await userService.getAll();
            const formatted = users.map(u => ({...u, archived: u.archived === 1}));
            res.status(200).json(formatted);
        } catch (error) {
            res.status(500).json({ message: 'Erreur', error });
        }
    }

    async create(req, res) {
        try {
            const newUser = await userService.create(req.body);
            res.status(201).json(newUser);
        } catch (error) {
            res.status(500).json({ message: 'Erreur', error });
        }
    }

    async update(req, res) {
        try {
            const result = await userService.update(req.params.id, req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Erreur', error });
        }
    }

    async archive(req, res) {
        try {
            const result = await userService.setArchiveStatus(req.params.id, true);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Erreur', error });
        }
    }

    async restore(req, res) {
        try {
            const result = await userService.setArchiveStatus(req.params.id, false);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: 'Erreur', error });
        }
    }
}

module.exports = new UserController();
