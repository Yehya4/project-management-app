const userService = require('../services/userService');

class UserController {
    async getAll(req, res) {
        try {
            const users = await userService.getAll();
            return res.status(200).json(users);
        } catch (error) {
            return res.status(500).json({ message: 'Erreur', error });
        }
    }

    async create(req, res) {
        try {
            const newUser = await userService.create(req.body);
            return res.status(201).json(newUser);
        } catch (error) {
            return res.status(500).json({ message: 'Erreur', error });
        }
    }

    async update(req, res) {
        try {
            const result = await userService.update(req.params.id, req.body);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: 'Erreur', error });
        }
    }

    async archive(req, res) {
        try {
            const result = await userService.setArchiveStatus(req.params.id, true);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: 'Erreur', error });
        }
    }

    async restore(req, res) {
        try {
            const result = await userService.setArchiveStatus(req.params.id, false);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: 'Erreur', error });
        }
    }
}

module.exports = new UserController();
