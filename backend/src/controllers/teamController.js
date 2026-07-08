const teamService = require('../services/teamService');
const userService = require('../services/userService');
const projectService = require('../services/projectService');

class TeamController {
    async getAllMembers(req, res) {
        try {
            const teams = await teamService.getAllMembers();
            res.json(teams);
        } catch (err) {
            console.error('Error fetching all members:', err);
            res.status(500).json({ message: 'Erreur lors de la récupération de tous les membres.' });
        }
    }

    async getMembers(req, res) {
        try {
            const { projectId } = req.params;
            const members = await teamService.getProjectMembers(projectId);
            res.json(members);
        } catch (err) {
            console.error('Error fetching project members:', err);
            res.status(500).json({ message: 'Erreur lors de la récupération des membres de l\'équipe.' });
        }
    }

    async addOrUpdateMember(req, res) {
        try {
            const { projectId } = req.params;
            const { userId, role } = req.body;
            
            if (!userId || !role) {
                return res.status(400).json({ message: 'userId et role sont requis.' });
            }

            const member = await teamService.addOrUpdateMember(projectId, userId, role);
            
            
            const io = req.app.get('io');
            if (io) {
                try {
                    const actingUser = await userService.getById(req.user.id);
                    const actingName = actingUser ? `${actingUser.prenom || ''} ${actingUser.nom || ''}`.trim() : 'Un administrateur';
                    const actingRole = req.user.role === 'Project Manager' ? 'Le PM' : (req.user.role === 'Sponsor' ? 'Le Sponsor' : 'L\'Admin');
                    
                    const project = await projectService.getById(projectId);
                    const projectName = project ? project.nom : 'un projet';
                    
                    const targetName = `${member.user.prenom || ''} ${member.user.nom || ''}`.trim();
                    const targetRole = member.user.fonction || role;
                    
                    
                    const notificationForAssigned = {
                        id: Date.now(),
                        title: 'Affectation à un projet',
                        message: `${actingName} vous a ajouté au projet "${projectName}".`,
                        date: 'À l\'instant',
                        read: false,
                        type: 'info'
                    };
                    io.to(`user_${userId}`).emit('new_notification', notificationForAssigned);
                    
                    
                    const notificationForManagement = {
                        id: Date.now() + 1,
                        title: 'Nouveau membre de projet',
                        message: `${actingRole} ${actingName} a ajouté ${targetName} (${targetRole}) au projet "${projectName}".`,
                        date: 'À l\'instant',
                        read: false,
                        type: 'info'
                    };
                    io.to('role_Admin').to('role_Sponsor').to('role_Project Manager').emit('new_notification', notificationForManagement);
                    
                } catch (notifErr) {
                    console.error('Error emitting assignment notifications:', notifErr);
                }
            }

            res.status(201).json(member);
        } catch (err) {
            console.error('Error adding/updating project member:', err);
            res.status(500).json({ message: 'Erreur lors de l\'ajout ou modification du membre de l\'équipe.' });
        }
    }

    async removeMember(req, res) {
        try {
            const { projectId, userId } = req.params;
            await teamService.removeMember(projectId, userId);
            res.json({ message: 'Membre supprimé avec succès.' });
        } catch (err) {
            console.error('Error removing project member:', err);
            res.status(500).json({ message: 'Erreur lors de la suppression du membre de l\'équipe.' });
        }
    }
}

module.exports = new TeamController();
