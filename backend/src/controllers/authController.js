const authService = require('../services/authService');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

class AuthController {
    async login(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Veuillez fournir un email et un mot de passe.' });
        }

        try {
            const user = await authService.login(email, password);

            if (user) {
                const token = jwt.sign(
                    { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                res.status(200).json({
                    message: 'Connexion réussie',
                    user: user,
                    token: token
                });
            } else {
                res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
            }
        } catch (error) {
            console.error('Erreur lors du login:', error);
            res.status(500).json({ message: 'Erreur interne du serveur.' });
        }
    }
}

module.exports = new AuthController();
