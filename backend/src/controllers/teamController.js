const teamService = require('../services/teamService');

class TeamController {
    async getAllMembers(req, res) {
        try {
            const teams = await teamService.getAllMembers();
            return res.json(teams);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de la récupération de tous les membres.' });
        }
    }

    async getMembers(req, res) {
        try {
            const { projectId } = req.params;
            const members = await teamService.getProjectMembers(projectId);
            return res.json(members);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de la récupération des membres de l\'équipe.' });
        }
    }

    async addOrUpdateMember(req, res) {
        try {
            const { projectId } = req.params;
            const { userId, role } = req.body;
            
            if (!userId || !role) {
                return res.status(400).json({ message: 'userId et role sont requis.' });
            }

            const io = req.app.get('io');
            const member = await teamService.addOrUpdateMember(projectId, userId, role, io, req.user);
            return res.status(201).json(member);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de l\'ajout ou modification du membre de l\'équipe.' });
        }
    }

    async removeMember(req, res) {
        try {
            const { projectId, userId } = req.params;
            await teamService.removeMember(projectId, userId);
            return res.json({ message: 'Membre supprimé avec succès.' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de la suppression du membre de l\'équipe.' });
        }
    }
}

module.exports = new TeamController();
