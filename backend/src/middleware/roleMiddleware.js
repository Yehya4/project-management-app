const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Accès refusé. Droits administrateur requis.' });
    }
};

module.exports = requireAdmin;
