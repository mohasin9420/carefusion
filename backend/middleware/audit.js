const AuditLog = require('../models/AuditLog');

/**
 * Audit middleware - logs actions to AuditLog collection
 * Use as: router.post('/action', audit('action_name', 'resource'), controller)
 */
exports.audit = (action, resource = 'other') => {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                AuditLog.create({
                    userId: req.user?._id,
                    role: req.user?.role,
                    action,
                    resource,
                    resourceId: req.params?.id || body?._id || body?.id,
                    details: { method: req.method, path: req.path },
                    ipAddress: req.ip || req.connection?.remoteAddress,
                    userAgent: req.get('User-Agent')
                }).catch(err => console.error('Audit log failed:', err));
            }
            return originalJson(body);
        };
        next();
    };
};
