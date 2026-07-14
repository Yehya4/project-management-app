const notificationService = require('../services/notificationService');

exports.getAll = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const notifications = await notificationService.getNotificationsForUser(userId, role);
        return res.json(notifications);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({ message: 'Erreur lors de la récupération des notifications' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await notificationService.markAsRead(id);
        return res.json({ success: true });
    } catch (err) {
        console.error('Error marking notification as read:', err);
        return res.status(500).json({ message: 'Erreur système' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        await notificationService.markAllAsRead(userId, role);
        return res.json({ success: true });
    } catch (err) {
        console.error('Error marking notifications as read:', err);
        return res.status(500).json({ message: 'Erreur système' });
    }
};
