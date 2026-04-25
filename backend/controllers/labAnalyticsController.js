const LabTest = require('../models/LabTest');

// @desc    Get daily test volume analytics
// @route   GET /api/laboratory/analytics/daily-volume
// @access  Private/Lab
exports.getDailyTestVolume = async (req, res) => {
    try {
        const { date } = req.query;

        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const tests = await LabTest.find({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        // Category breakdown
        const categoryBreakdown = tests.reduce((acc, test) => {
            acc[test.testCategory] = (acc[test.testCategory] || 0) + 1;
            return acc;
        }, {});

        // Priority breakdown
        const priorityBreakdown = tests.reduce((acc, test) => {
            acc[test.priority] = (acc[test.priority] || 0) + 1;
            return acc;
        }, {});

        // Status breakdown
        const statusBreakdown = tests.reduce((acc, test) => {
            acc[test.status] = (acc[test.status] || 0) + 1;
            return acc;
        }, {});

        res.json({
            date: startOfDay,
            totalTests: tests.length,
            categoryBreakdown,
            priorityBreakdown,
            statusBreakdown,
            tests
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get turnaround time analytics
// @route   GET /api/laboratory/analytics/turnaround-time
// @access  Private/Lab
exports.getTurnaroundTimeAnalytics = async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const completedTests = await LabTest.find({
            status: 'completed',
            createdAt: { $gte: startDate },
            actualTAT: { $exists: true, $ne: null }
        });

        if (completedTests.length === 0) {
            return res.json({
                message: 'No completed tests found',
                averageTAT: 0,
                totalTests: 0
            });
        }

        // Calculate statistics
        const totalTAT = completedTests.reduce((sum, test) => sum + test.actualTAT, 0);
        const averageTAT = (totalTAT / completedTests.length).toFixed(2);

        // Find min and max
        const minTAT = Math.min(...completedTests.map(t => t.actualTAT));
        const maxTAT = Math.max(...completedTests.map(t => t.actualTAT));

        // Tests within expected TAT
        const withinExpected = completedTests.filter(t => t.actualTAT <= t.expectedTAT).length;
        const withinExpectedPercentage = ((withinExpected / completedTests.length) * 100).toFixed(2);

        // Category-wise TAT
        const categoryTAT = completedTests.reduce((acc, test) => {
            if (!acc[test.testCategory]) {
                acc[test.testCategory] = { total: 0, count: 0 };
            }
            acc[test.testCategory].total += test.actualTAT;
            acc[test.testCategory].count += 1;
            return acc;
        }, {});

        const categoryAverages = {};
        Object.keys(categoryTAT).forEach(category => {
            categoryAverages[category] = (categoryTAT[category].total / categoryTAT[category].count).toFixed(2);
        });

        res.json({
            period: `Last ${days} days`,
            totalTests: completedTests.length,
            averageTAT: parseFloat(averageTAT),
            minTAT,
            maxTAT,
            withinExpected,
            withinExpectedPercentage: parseFloat(withinExpectedPercentage),
            categoryAverages
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get abnormal results report
// @route   GET /api/laboratory/analytics/abnormal-results
// @access  Private/Lab
exports.getAbnormalResultsReport = async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const testsWithResults = await LabTest.find({
            status: 'completed',
            createdAt: { $gte: startDate },
            'results.isAbnormal': true
        })
            .populate('patientId', 'fullName age gender')
            .populate('doctorId', 'fullName specialization');

        // Count abnormal results by parameter
        const abnormalByParameter = {};
        const criticalResults = [];

        testsWithResults.forEach(test => {
            test.results.forEach(result => {
                if (result.isAbnormal) {
                    if (!abnormalByParameter[result.parameter]) {
                        abnormalByParameter[result.parameter] = {
                            count: 0,
                            low: 0,
                            high: 0,
                            critical: 0
                        };
                    }
                    abnormalByParameter[result.parameter].count += 1;

                    if (result.flag === 'low') abnormalByParameter[result.parameter].low += 1;
                    if (result.flag === 'high') abnormalByParameter[result.parameter].high += 1;
                    if (result.flag === 'critical') {
                        abnormalByParameter[result.parameter].critical += 1;
                        criticalResults.push({
                            testId: test.testId,
                            patient: test.patientId.fullName,
                            parameter: result.parameter,
                            value: result.value,
                            referenceRange: result.referenceRange,
                            date: test.createdAt
                        });
                    }
                }
            });
        });

        res.json({
            period: `Last ${days} days`,
            totalAbnormalTests: testsWithResults.length,
            abnormalByParameter,
            criticalResults,
            tests: testsWithResults
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get technician performance
// @route   GET /api/laboratory/analytics/technician-performance
// @access  Private/Lab
exports.getTechnicianPerformance = async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const tests = await LabTest.find({
            createdAt: { $gte: startDate },
            assignedTo: { $exists: true }
        }).populate('assignedTo', 'name email');

        // Group by technician
        const technicianStats = {};

        tests.forEach(test => {
            const techId = test.assignedTo?._id?.toString();
            if (!techId) return;

            if (!technicianStats[techId]) {
                technicianStats[techId] = {
                    technician: test.assignedTo,
                    totalTests: 0,
                    completedTests: 0,
                    averageTAT: 0,
                    totalTAT: 0,
                    testsWithinExpected: 0
                };
            }

            technicianStats[techId].totalTests += 1;

            if (test.status === 'completed') {
                technicianStats[techId].completedTests += 1;

                if (test.actualTAT) {
                    technicianStats[techId].totalTAT += test.actualTAT;

                    if (test.actualTAT <= test.expectedTAT) {
                        technicianStats[techId].testsWithinExpected += 1;
                    }
                }
            }
        });

        // Calculate averages
        Object.keys(technicianStats).forEach(techId => {
            const stats = technicianStats[techId];
            if (stats.completedTests > 0) {
                stats.averageTAT = (stats.totalTAT / stats.completedTests).toFixed(2);
                stats.onTimePercentage = ((stats.testsWithinExpected / stats.completedTests) * 100).toFixed(2);
            }
        });

        res.json({
            period: `Last ${days} days`,
            technicianStats: Object.values(technicianStats)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// All functions already exported via exports.functionName above