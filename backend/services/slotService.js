const DoctorAvailability = require('../models/DoctorAvailability');
const BlockedSlot = require('../models/BlockedSlot');
const Appointment = require('../models/Appointment');

/**
 * Generate time slots for a specific doctor on a specific date
 * @param {ObjectId} doctorId - Doctor's ID
 * @param {Date} date - Date for which to generate slots
 * @returns {Array} Array of slot objects with availability info
 */
exports.generateSlots = async (doctorId, date) => {
    try {
        // Get day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
        const dayOfWeek = new Date(date).getDay();

        // Get doctor's availability for this day of week
        const availability = await DoctorAvailability.findOne({
            doctorId,
            dayOfWeek,
            isActive: true
        });

        // If no availability configured for this day, return empty array
        if (!availability) {
            return [];
        }

        // Check if the entire day is blocked
        const dayBlocked = await BlockedSlot.findOne({
            doctorId,
            blockedDate: {
                $gte: new Date(date).setHours(0, 0, 0, 0),
                $lt: new Date(date).setHours(23, 59, 59, 999)
            },
            isFullDay: true
        });

        if (dayBlocked) {
            return [];
        }

        // Generate time slots based on availability
        const slots = [];
        let currentTime = availability.startTime;
        const endTime = availability.endTime;
        const duration = availability.slotDuration;

        while (currentTime < endTime) {
            const nextTime = addMinutes(currentTime, duration);

            // Don't add slot if it extends beyond end time
            if (nextTime > endTime) {
                break;
            }

            // Check if this specific time slot is blocked
            const slotBlocked = await BlockedSlot.findOne({
                doctorId,
                blockedDate: {
                    $gte: new Date(date).setHours(0, 0, 0, 0),
                    $lt: new Date(date).setHours(23, 59, 59, 999)
                },
                isFullDay: false,
                startTime: { $lte: currentTime },
                endTime: { $gte: nextTime }
            });

            if (!slotBlocked) {
                // Count existing bookings for this slot.
                // Include ALL non-cancelled statuses so a booked slot stays
                // permanently unavailable for this day even after completion.
                const bookedCount = await Appointment.countDocuments({
                    doctorId,
                    appointmentDate: {
                        $gte: new Date(date).setHours(0, 0, 0, 0),
                        $lt: new Date(date).setHours(23, 59, 59, 999)
                    },
                    slotStartTime: currentTime,
                    status: { $nin: ['cancelled'] }
                });

                // Slot is available if booked count is less than max capacity
                const isAvailable = bookedCount < availability.maxPatientsPerSlot;

                slots.push({
                    startTime: currentTime,
                    endTime: nextTime,
                    isAvailable,
                    bookedCount,
                    maxCapacity: availability.maxPatientsPerSlot,
                    duration: duration
                });
            }

            currentTime = nextTime;
        }

        return slots;
    } catch (error) {
        console.error('Error generating slots:', error);
        throw error;
    }
};

/**
 * Helper function to add minutes to a time string
 * @param {String} time - Time in format "HH:MM"
 * @param {Number} minutes - Minutes to add
 * @returns {String} New time in format "HH:MM"
 */
function addMinutes(time, minutes) {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

/**
 * Check if a specific slot is available for booking
 * @param {ObjectId} doctorId 
 * @param {Date} date 
 * @param {String} startTime 
 * @param {String} endTime 
 * @returns {Boolean} true if slot is available
 */
exports.isSlotAvailable = async (doctorId, date, startTime, endTime) => {
    try {
        const slots = await this.generateSlots(doctorId, date);
        const requestedSlot = slots.find(slot =>
            slot.startTime === startTime && slot.endTime === endTime
        );

        return requestedSlot ? requestedSlot.isAvailable : false;
    } catch (error) {
        console.error('Error checking slot availability:', error);
        return false;
    }
};

/**
 * Get next available token number for walk-in patients
 * @param {ObjectId} doctorId 
 * @param {Date} date 
 * @returns {Number} Next token number
 */
exports.getNextTokenNumber = async (doctorId, date) => {
    try {
        const lastWalkin = await Appointment.findOne({
            doctorId,
            appointmentDate: {
                $gte: new Date(date).setHours(0, 0, 0, 0),
                $lt: new Date(date).setHours(23, 59, 59, 999)
            },
            bookingType: 'walkin'
        }).sort({ tokenNumber: -1 });

        return lastWalkin ? lastWalkin.tokenNumber + 1 : 1;
    } catch (error) {
        console.error('Error getting next token:', error);
        return 1;
    }
};

module.exports = exports;
