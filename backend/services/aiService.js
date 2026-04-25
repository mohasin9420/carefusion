const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const LabTest = require('../models/LabTest');
const Medicine = require('../models/Medicine');
const Bill = require('../models/Bill');

// @desc    Smart appointment slot suggestion
// @route   POST /api/ai/appointment-suggestion
// @access  Private
exports.suggestAppointmentSlot = async (req, res) => {
    try {
        const { doctorId, patientId, preferredDate } = req.body;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Get doctor's appointment history
        const appointments = await Appointment.find({
            doctorId,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        });

        // Analyze patterns
        const hourlyLoad = {};
        appointments.forEach(apt => {
            const hour = new Date(apt.appointmentDate).getHours();
            hourlyLoad[hour] = (hourlyLoad[hour] || 0) + 1;
        });

        // Find least busy hours
        const recommendedHours = Object.entries(hourlyLoad)
            .sort((a, b) => a[1] - b[1])
            .slice(0, 3)
            .map(([hour]) => parseInt(hour));

        // Generate available slots for preferred date
        const targetDate = new Date(preferredDate);
        const bookedSlots = await Appointment.find({
            doctorId,
            appointmentDate: {
                $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                $lte: new Date(targetDate.setHours(23, 59, 59, 999))
            }
        }).select('timeSlot');

        const bookedTimes = bookedSlots.map(apt => apt.timeSlot);

        // Generate smart suggestions
        const suggestions = [];
        recommendedHours.forEach(hour => {
            const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
            if (!bookedTimes.includes(timeSlot)) {
                suggestions.push({
                    timeSlot,
                    reason: 'Low traffic period',
                    confidence: 'high'
                });
            }
        });

        res.json({
            doctor: doctor.fullName,
            date: preferredDate,
            suggestions,
            analysis: {
                totalAppointments: appointments.length,
                peakHours: Object.entries(hourlyLoad)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Disease pattern analysis
// @route   GET /api/ai/disease-patterns
// @access  Private/Doctor/Admin
exports.analyzeDiseasePatterns = async (req, res) => {
    try {
        const { days = 90 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Analyze prescriptions for disease patterns
        const prescriptions = await Prescription.find({
            createdAt: { $gte: startDate }
        }).populate('patientId', 'age gender');

        // Group by diagnosis
        const diseaseFrequency = {};
        const ageGroups = { '0-18': {}, '19-40': {}, '41-60': {}, '60+': {} };
        const genderDistribution = { male: {}, female: {}, other: {} };

        prescriptions.forEach(prescription => {
            const diagnosis = prescription.diagnosis || 'Unspecified';

            // Overall frequency
            diseaseFrequency[diagnosis] = (diseaseFrequency[diagnosis] || 0) + 1;

            // Age group analysis
            const patient = prescription.patientId;
            if (patient) {
                const age = patient.age || 0;
                let ageGroup;
                if (age <= 18) ageGroup = '0-18';
                else if (age <= 40) ageGroup = '19-40';
                else if (age <= 60) ageGroup = '41-60';
                else ageGroup = '60+';

                if (!ageGroups[ageGroup][diagnosis]) {
                    ageGroups[ageGroup][diagnosis] = 0;
                }
                ageGroups[ageGroup][diagnosis]++;

                // Gender distribution
                const gender = patient.gender || 'other';
                if (!genderDistribution[gender][diagnosis]) {
                    genderDistribution[gender][diagnosis] = 0;
                }
                genderDistribution[gender][diagnosis]++;
            }
        });

        // Sort by frequency
        const topDiseases = Object.entries(diseaseFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([disease, count]) => ({ disease, count }));

        res.json({
            period: `Last ${days} days`,
            totalPrescriptions: prescriptions.length,
            topDiseases,
            ageGroupAnalysis: ageGroups,
            genderDistribution
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Doctor workload balancing
// @route   GET /api/ai/workload-balancing
// @access  Private/Admin
exports.balanceDoctorWorkload = async (req, res) => {
    try {
        const { days = 7 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const doctors = await Doctor.find({ isActive: true });

        const workloadAnalysis = await Promise.all(
            doctors.map(async (doctor) => {
                const appointments = await Appointment.countDocuments({
                    doctorId: doctor._id,
                    createdAt: { $gte: startDate }
                });

                const avgDailyLoad = appointments / parseInt(days);

                return {
                    doctorId: doctor._id,
                    doctorName: doctor.fullName,
                    specialization: doctor.specialization,
                    totalAppointments: appointments,
                    avgDailyLoad: avgDailyLoad.toFixed(2),
                    status: avgDailyLoad > 10 ? 'overloaded' : avgDailyLoad < 3 ? 'underutilized' : 'balanced'
                };
            })
        );

        // Recommendations
        const overloaded = workloadAnalysis.filter(d => d.status === 'overloaded');
        const underutilized = workloadAnalysis.filter(d => d.status === 'underutilized');

        const recommendations = [];
        if (overloaded.length > 0 && underutilized.length > 0) {
            recommendations.push({
                action: 'redistribute',
                suggestion: `Consider redistributing appointments from overloaded doctors (${overloaded.map(d => d.doctorName).join(', ')}) to underutilized doctors (${underutilized.map(d => d.doctorName).join(', ')})`
            });
        }

        res.json({
            period: `Last ${days} days`,
            workloadAnalysis: workloadAnalysis.sort((a, b) => b.totalAppointments - a.totalAppointments),
            recommendations
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Patient risk prediction
// @route   GET /api/ai/patient-risk/:patientId
// @access  Private/Doctor
exports.predictPatientRisk = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.patientId);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        let riskScore = 0;
        const riskFactors = [];

        // Age risk
        if (patient.age > 60) {
            riskScore += 20;
            riskFactors.push('Age > 60 years');
        } else if (patient.age > 40) {
            riskScore += 10;
            riskFactors.push('Age > 40 years');
        }

        // Chronic diseases
        if (patient.chronicDiseases && patient.chronicDiseases.length > 0) {
            const severeConditions = patient.chronicDiseases.filter(
                d => d.severity === 'severe' || d.severity === 'critical'
            );
            riskScore += severeConditions.length * 15;
            riskFactors.push(`${severeConditions.length} severe chronic condition(s)`);
        }

        // Severe allergies
        if (patient.allergies && patient.allergies.length > 0) {
            const severeAllergies = patient.allergies.filter(
                a => a.severity === 'severe' || a.severity === 'critical'
            );
            riskScore += severeAllergies.length * 10;
            if (severeAllergies.length > 0) {
                riskFactors.push(`${severeAllergies.length} severe allergy(ies)`);
            }
        }

        // Recent hospitalizations
        const recentAppointments = await Appointment.countDocuments({
            patientId: patient._id,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        if (recentAppointments > 5) {
            riskScore += 15;
            riskFactors.push('Frequent recent appointments');
        }

        // Risk level classification
        let riskLevel;
        if (riskScore >= 50) riskLevel = 'high';
        else if (riskScore >= 25) riskLevel = 'medium';
        else riskLevel = 'low';

        res.json({
            patient: {
                id: patient._id,
                name: patient.fullName,
                age: patient.age,
                gender: patient.gender
            },
            riskAssessment: {
                riskScore,
                riskLevel,
                riskFactors,
                recommendations: riskLevel === 'high'
                    ? ['Regular monitoring recommended', 'Consider preventive care', 'Alert medical team']
                    : riskLevel === 'medium'
                        ? ['Periodic check-ups recommended', 'Monitor existing conditions']
                        : ['Continue routine care']
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Peak hour prediction
// @route   GET /api/ai/peak-hours
// @access  Private/Admin
exports.predictPeakHours = async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const appointments = await Appointment.find({
            createdAt: { $gte: startDate }
        });

        // Analyze by hour
        const hourlyDistribution = {};
        const dailyDistribution = {};

        appointments.forEach(apt => {
            const date = new Date(apt.appointmentDate);
            const hour = date.getHours();
            const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

            hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
            dailyDistribution[dayOfWeek] = (dailyDistribution[dayOfWeek] || 0) + 1;
        });

        // Find peak hours
        const peakHours = Object.entries(hourlyDistribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([hour, count]) => ({
                hour: `${hour}:00`,
                appointments: count,
                avgPerDay: (count / parseInt(days)).toFixed(2)
            }));

        // Find peak days
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const peakDays = Object.entries(dailyDistribution)
            .sort((a, b) => b[1] - a[1])
            .map(([day, count]) => ({
                day: dayNames[parseInt(day)],
                appointments: count
            }));

        res.json({
            period: `Last ${days} days`,
            totalAppointments: appointments.length,
            peakHours,
            peakDays,
            recommendations: [
                `Staff additional personnel during ${peakHours[0]?.hour || 'peak hours'}`,
                `${peakDays[0]?.day || 'Peak day'} requires maximum capacity`
            ]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// All functions already exported via exports.functionName above

