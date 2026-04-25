// Email service has been disabled.
// All functions are no-ops that log a warning and return a disabled status.

exports.sendOtpEmail = async (email, name, otp) => {
    console.log('⚠️  [EmailService] Email sending is disabled. Skipping OTP for:', email);
    return { success: false, disabled: true };
};

exports.sendPasswordResetEmail = async (email, name, token) => {
    console.log('⚠️  [EmailService] Email sending is disabled. Skipping password reset for:', email);
    return { success: false, disabled: true };
};

exports.sendAppointmentReminder = async (email, patientName, doctorName, appointmentDate, timeSlot) => {
    console.log('⚠️  [EmailService] Email sending is disabled. Skipping appointment reminder for:', email);
    return { success: false, disabled: true };
};

exports.sendTestEmail = async (toEmail, customConfig = null) => {
    console.log('⚠️  [EmailService] Email sending is disabled. Test email skipped for:', toEmail);
    return { success: false, disabled: true };
};
