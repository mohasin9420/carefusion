const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'login',
            'logout',
            'user_created',
            'user_updated',
            'user_deleted',
            'user_approved',
            'user_blocked',
            'user_suspended',
            'prescription_created',
            'prescription_updated',
            'prescription_deleted',
            'data_accessed',
            'data_modified',
            'role_changed',
            'permission_modified',
            'security_alert',
            'failed_login',
            'password_reset',
            'config_changed',
            'department_created',
            'department_modified'
        ]
    },
    category: {
        type: String,
        enum: ['authentication', 'user_management', 'prescription', 'data_access', 'security', 'configuration'],
        required: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
    },
    description: {
        type: String,
        required: true
    },
    ipAddress: String,
    userAgent: String,
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    targetResource: {
        resourceType: String, // 'user', 'prescription', 'patient', etc.
        resourceId: mongoose.Schema.Types.ObjectId
    },
    isSecurityAlert: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ category: 1 });
auditLogSchema.index({ isSecurityAlert: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
