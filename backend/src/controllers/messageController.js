const messageService = require('../services/messageService');

exports.getAll = (req, res) => {
    try {
        const messages = messageService.getAllMessages();
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
    }
};
