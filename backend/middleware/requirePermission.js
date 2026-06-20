// Vérifie qu'une permission spécifique est présente dans req.permissions (issu du JWT).
// Utilisation : router.post('/route', requirePermission('finance.admin'), controller)
module.exports = function requirePermission(key) {
  return (req, res, next) => {
    const val = key.split('.').reduce((obj, k) => obj?.[k], req.permissions);
    if (!val) return res.status(403).json({ message: 'Permission refusée' });
    next();
  };
};
