const messageService = require('../services/messageService');

exports.getAll = async (req, res) => {
    try {
        const userId = req.user.id;
        const messages = await messageService.getMessagesForUser(userId);
        return res.json(messages);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
    }
};
