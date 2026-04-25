const LabTest = require('../models/LabTest');

// ──────────────────────────────────────────────────────────────
// Helper: Build date range
// ──────────────────────────────────────────────────────────────
const buildDateRange = (type, dateParam) => {
    const now = dateParam ? new Date(dateParam) : new Date();

    if (type === 'daily') {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    if (type === 'monthly') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start, end };
    }

    return null;
};

// ──────────────────────────────────────────────────────────────
// @desc    Get expense summary (today + this month + all time)
// @route   GET /api/laboratory/expenses/summary
// ──────────────────────────────────────────────────────────────
exports.getExpenseSummary = async (req, res) => {
    try {
        const todayRange = buildDateRange('daily');
        const monthRange = buildDateRange('monthly');

        const [todayTests, monthTests, allTests] = await Promise.all([
            LabTest.find({
                paymentAmount: { $ne: null, $exists: true },
                createdAt: { $gte: todayRange.start, $lte: todayRange.end }
            }).select('paymentAmount testName patientId createdAt'),

            LabTest.find({
                paymentAmount: { $ne: null, $exists: true },
                createdAt: { $gte: monthRange.start, $lte: monthRange.end }
            }).select('paymentAmount testName patientId createdAt'),

            LabTest.find({
                paymentAmount: { $ne: null, $exists: true }
            }).select('paymentAmount testName patientId createdAt')
        ]);

        const sum = (arr) => arr.reduce((acc, t) => acc + (t.paymentAmount || 0), 0);

        res.json({
            today: {
                total: sum(todayTests),
                count: todayTests.length
            },
            month: {
                total: sum(monthTests),
                count: monthTests.length
            },
            allTime: {
                total: sum(allTests),
                count: allTests.length
            }
        });
    } catch (error) {
        console.error('Expense summary error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ──────────────────────────────────────────────────────────────
// @desc    Get daily expense breakdown (last 30 days or specific month)
// @route   GET /api/laboratory/expenses/daily?month=YYYY-MM
// ──────────────────────────────────────────────────────────────
exports.getDailyExpenses = async (req, res) => {
    try {
        const { month } = req.query; // e.g. "2026-04"
        let start, end;

        if (month) {
            const [year, mon] = month.split('-').map(Number);
            start = new Date(year, mon - 1, 1, 0, 0, 0, 0);
            end = new Date(year, mon, 0, 23, 59, 59, 999);
        } else {
            // Last 30 days
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 29);
            start.setHours(0, 0, 0, 0);
        }

        const tests = await LabTest.find({
            paymentAmount: { $ne: null, $exists: true },
            createdAt: { $gte: start, $lte: end }
        })
            .populate('patientId', 'fullName')
            .select('paymentAmount testName patientId createdAt status')
            .sort({ createdAt: 1 });

        // Group by date
        const grouped = {};
        tests.forEach(t => {
            const dateKey = new Date(t.createdAt).toISOString().split('T')[0];
            if (!grouped[dateKey]) {
                grouped[dateKey] = { date: dateKey, total: 0, count: 0, tests: [] };
            }
            grouped[dateKey].total += t.paymentAmount || 0;
            grouped[dateKey].count++;
            grouped[dateKey].tests.push({
                _id: t._id,
                testName: t.testName,
                patientName: t.patientId?.fullName || 'Unknown',
                amount: t.paymentAmount,
                status: t.status,
                time: t.createdAt
            });
        });

        const days = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));

        res.json({
            period: { from: start, to: end },
            days,
            grandTotal: tests.reduce((acc, t) => acc + (t.paymentAmount || 0), 0),
            totalTests: tests.length
        });
    } catch (error) {
        console.error('Daily expenses error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ──────────────────────────────────────────────────────────────
// @desc    Get monthly expense breakdown (last 12 months)
// @route   GET /api/laboratory/expenses/monthly
// ──────────────────────────────────────────────────────────────
exports.getMonthlyExpenses = async (req, res) => {
    try {
        const now = new Date();
        const start = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1, 0, 0, 0, 0);

        const tests = await LabTest.find({
            paymentAmount: { $ne: null, $exists: true },
            createdAt: { $gte: start }
        })
            .select('paymentAmount testName createdAt status')
            .sort({ createdAt: 1 });

        // Group by month
        const grouped = {};
        tests.forEach(t => {
            const d = new Date(t.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!grouped[key]) {
                grouped[key] = {
                    month: key,
                    label: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
                    total: 0,
                    count: 0
                };
            }
            grouped[key].total += t.paymentAmount || 0;
            grouped[key].count++;
        });

        const months = Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));

        res.json({
            months,
            grandTotal: tests.reduce((acc, t) => acc + (t.paymentAmount || 0), 0),
            totalTests: tests.length
        });
    } catch (error) {
        console.error('Monthly expenses error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ──────────────────────────────────────────────────────────────
// @desc    Get per-patient expense breakdown
// @route   GET /api/laboratory/expenses/patients
// ──────────────────────────────────────────────────────────────
exports.getPatientExpenses = async (req, res) => {
    try {
        const { month } = req.query;
        let matchStage = { paymentAmount: { $ne: null, $exists: true } };

        if (month) {
            const [year, mon] = month.split('-').map(Number);
            const start = new Date(year, mon - 1, 1, 0, 0, 0, 0);
            const end = new Date(year, mon, 0, 23, 59, 59, 999);
            matchStage.createdAt = { $gte: start, $lte: end };
        }

        const results = await LabTest.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'patients',
                    localField: 'patientId',
                    foreignField: '_id',
                    as: 'patient'
                }
            },
            { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$patientId',
                    patientName: { $first: '$patient.fullName' },
                    patientMobile: { $first: '$patient.mobile' },
                    totalAmount: { $sum: '$paymentAmount' },
                    testCount: { $sum: 1 },
                    tests: {
                        $push: {
                            testName: '$testName',
                            amount: '$paymentAmount',
                            date: '$createdAt',
                            status: '$status'
                        }
                    }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        res.json({
            patients: results,
            grandTotal: results.reduce((acc, p) => acc + p.totalAmount, 0),
            totalPatients: results.length
        });
    } catch (error) {
        console.error('Patient expenses error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
