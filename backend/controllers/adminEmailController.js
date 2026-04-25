// Email configuration has been disabled across this system.
// These controller stubs are kept to avoid import errors in admin routes.

// @desc    Get email config — disabled
exports.getEmailConfig = async (req, res) => {
    res.json({
        disabled: true,
        message: 'Email configuration has been removed from this system.',
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        fromName: '',
        fromEmail: '',
        otpEnabled: false,
        isConfigured: false
    });
};

// @desc    Update email config — disabled
exports.updateEmailConfig = async (req, res) => {
    res.status(410).json({
        message: 'Email configuration has been permanently removed from this system.'
    });
};

// @desc    Test email config — disabled
exports.testEmailConfig = async (req, res) => {
    res.status(410).json({
        message: 'Email testing has been permanently removed from this system.'
    });
};
