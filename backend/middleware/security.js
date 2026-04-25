const AuditLog = require('../models/AuditLog');

// Middleware to log all API access
const accessLogger = async (req, res, next) => {
    const startTime = Date.now();

    // Store original end function
    const originalEnd = res.end;

    // Override end function to log after response
    res.end = async function (...args) {
        const duration = Date.now() - startTime;

        // Only log if user is authenticated
        if (req.user) {
            try {
                const severityMap = {
                    'GET': 'low',
                    'POST': 'medium',
                    'PUT': 'medium',
                    'DELETE': 'high',
                    'PATCH': 'medium'
                };

                await AuditLog.create({
                    userId: req.user._id,
                    action: 'data_accessed',
                    category: 'data_access',
                    severity: severityMap[req.method] || 'low',
                    description: `${req.method} ${req.originalUrl}`,
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('user-agent'),
                    metadata: {
                        method: req.method,
                        path: req.originalUrl,
                        statusCode: res.statusCode,
                        duration: `${duration}ms`,
                        body: req.method !== 'GET' ? req.body : undefined
                    }
                });
            } catch (error) {
                console.error('Access logging error:', error);
            }
        }

        // Call original end function
        originalEnd.apply(res, args);
    };

    next();
};

// Middleware to detect suspicious activity
const securityMonitor = async (req, res, next) => {
    try {
        // Check for multiple failed login attempts
        if (req.path.includes('/login') && req.method === 'POST') {
            const recentFailedLogins = await AuditLog.countDocuments({
                action: 'failed_login',
                ipAddress: req.ip || req.connection.remoteAddress,
                createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 minutes
            });

            if (recentFailedLogins >= 5) {
                // Create security alert
                await AuditLog.create({
                    userId: req.user?._id || null,
                    action: 'security_alert',
                    category: 'security',
                    severity: 'critical',
                    description: 'Multiple failed login attempts detected',
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('user-agent'),
                    isSecurityAlert: true,
                    metadata: {
                        failedAttempts: recentFailedLogins,
                        path: req.originalUrl
                    }
                });

                return res.status(429).json({
                    message: 'Too many failed login attempts. Please try again later.'
                });
            }
        }

        // Check for unusual access patterns
        if (req.user) {
            const recentAccesses = await AuditLog.countDocuments({
                userId: req.user._id,
                createdAt: { $gte: new Date(Date.now() - 60 * 1000) } // Last 1 minute
            });

            if (recentAccesses > 100) {
                await AuditLog.create({
                    userId: req.user._id,
                    action: 'security_alert',
                    category: 'security',
                    severity: 'high',
                    description: 'Unusual access pattern detected',
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('user-agent'),
                    isSecurityAlert: true,
                    metadata: {
                        accessesPerMinute: recentAccesses
                    }
                });
            }
        }

        next();
    } catch (error) {
        console.error('Security monitoring error:', error);
        next();
    }
};

// Middleware to sanitize input data
const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;

        const sanitized = Array.isArray(obj) ? [] : {};

        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                // Remove potential XSS attacks
                sanitized[key] = obj[key]
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;')
                    .replace(/\//g, '&#x2F;');
            } else if (typeof obj[key] === 'object') {
                sanitized[key] = sanitize(obj[key]);
            } else {
                sanitized[key] = obj[key];
            }
        }

        return sanitized;
    };

    if (req.body) {
        req.body = sanitize(req.body);
    }

    if (req.query) {
        req.query = sanitize(req.query);
    }

    next();
};

module.exports = {
    accessLogger,
    securityMonitor,
    sanitizeInput
};
