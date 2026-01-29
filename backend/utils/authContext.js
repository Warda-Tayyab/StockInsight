module.exports = function getAuthContext(req) {
  return {
    id: req.auth.userId || req.auth.adminId,
    email: req.auth.email,
    role: req.auth.role,
    tenantId: req.auth.tenantId || null
  };
};
