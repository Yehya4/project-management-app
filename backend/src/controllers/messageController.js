const messageService = require('../services/messageService');

exports.getAll = (req, res) => {
    try {
        const userId = req.user.id;
        const messages = messageService.getAllMessages();
        
        // Filter: Keep public channel messages OR private messages involving the current user
        const filteredMessages = messages.filter(m => {
            if (!m.recipientId) {
                return true;
            }
            return m.recipientId === userId || m.senderId === userId;
        });
        
        res.json(filteredMessages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
    }
};
