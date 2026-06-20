const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Non authentifié', expired: true });
    }
    try {
        const decoded = jwt.verify(auth.slice(7), process.env.AUTH_JWT_SECRET);
        req.userId = decoded.userId;
        req.permissions = decoded.permissions || {};
        next();
    } catch {
        return res.status(401).json({ message: 'Token invalide', expired: true });
    }
};
