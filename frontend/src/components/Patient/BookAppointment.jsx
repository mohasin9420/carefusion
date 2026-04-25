import { useState, useEffect } from 'react';
import { availabilityAPI, appointmentAPI, patientAPI } from '../../services/api';
import './BookAppointment.css';

const BookAppointment = ({ patientId }) => {
    const [step, setStep] = useState(1);
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Family member selection
    const [familyMembers, setFamilyMembers] = useState([]);
    const [bookedFor, setBookedFor] = useState('self'); // 'self' or memberId string

    // Same-day booking status
    const [sameDayCount, setSameDayCount] = useState(0);
    const [bookedMemberIds, setBookedMemberIds] = useState([]); // Array of memberId or null for self
    const [maxSlots, setMaxSlots] = useState(1);

    // Group doctors by department
    const [departments, setDepartments] = useState([]);

    // Payment state
    const [transactionId, setTransactionId] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [upiId, setUpiId] = useState('');
    const [amount, setAmount] = useState(0);
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    useEffect(() => {
        fetchDoctors();
        fetchFamilyMembers();
    }, []);

    const fetchDoctors = async () => {
        try {
            const response = await availabilityAPI.getAllDoctorsAvailability();
            const doctorsData = response.data.filter(d => d.hasSchedule);
            setDoctors(doctorsData);
            const uniqueDepts = [...new Set(doctorsData.map(d => d.department))];
            setDepartments(uniqueDepts);
        } catch (err) {
            console.error(err);
            setError('Failed to load doctors');
        }
    };

    const fetchFamilyMembers = async () => {
        try {
            const res = await patientAPI.getFamilyMembers();
            setFamilyMembers(res.data || []);
            setMaxSlots(1 + (res.data?.length || 0));
        } catch (err) {
            console.error('Could not load family members', err);
        }
    };

    const fetchSameDayAppointments = async (date) => {
        if (!patientId || !date) return;
        try {
            const res = await appointmentAPI.getMyAppointments(patientId);
            const todayApts = (res.data || []).filter(apt => {
                const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
                return aptDate === date && apt.status !== 'cancelled';
            });
            setSameDayCount(todayApts.length);
            setBookedMemberIds(todayApts.map(apt => apt.bookedForMember?.memberId || null));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAvailableSlots = async () => {
        if (!selectedDoctor || !selectedDate) return;
        setLoading(true);
        try {
            const response = await availabilityAPI.getAvailableSlots(selectedDoctor._id, selectedDate);
            setAvailableSlots(response.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load available slots');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (step === 3 && selectedDoctor && selectedDate) {
            fetchAvailableSlots();
        }
    }, [step, selectedDoctor, selectedDate]);

    useEffect(() => {
        if (selectedDate) fetchSameDayAppointments(selectedDate);
    }, [selectedDate]);

    const handleDoctorSelect = (doctor) => {
        setSelectedDoctor(doctor);
        setStep(2);
    };

    const handleDateSelect = () => {
        if (!selectedDate) return;
        if (sameDayCount >= maxSlots) {
            setError(`You've used all ${maxSlots} daily booking slot${maxSlots > 1 ? 's' : ''} for this date.`);
            return;
        }
        setError('');
        setStep(3);
    };

    const handleSlotSelect = (slot) => {
        setSelectedSlot(slot);
        setStep(4);
    };

    const getSelectedMember = () => {
        if (bookedFor === 'self') return null;
        return familyMembers.find(m => m._id === bookedFor) || null;
    };

    const handleProceedToPayment = () => {
        const doctorUpiId = selectedDoctor.upiId || 'hospital@upi';
        const amountToPay = selectedDoctor.consultationFee || 500;
        
        setUpiId(doctorUpiId);
        setAmount(amountToPay);
        
        // Generate QR using external API
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${doctorUpiId}&pn=${encodeURIComponent(selectedDoctor.fullName)}&am=${amountToPay}&cu=INR`;
        setQrCodeUrl(qrUrl);
        setStep(5);
    };

    const handleConfirmBooking = async () => {
        const currentPersonId = bookedFor === 'self' ? null : bookedFor;
        if (bookedMemberIds.includes(currentPersonId)) {
            setError(`This person already has an appointment on this date. Please choose another member or date.`);
            return;
        }

        if (!transactionId || transactionId.length < 8) {
            setError('Please enter a valid Transaction ID / UTR Number');
            return;
        }
        if (!selectedFile) {
            setError('Please upload a screenshot of your payment');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const member = getSelectedMember();
            
            // 1. Create Appointment
            const bookingData = {
                doctorId: selectedDoctor._id,
                patientId,
                appointmentDate: selectedDate,
                slotStartTime: selectedSlot.startTime,
                slotEndTime: selectedSlot.endTime,
                bookingType: 'appointment',
                consultationCharge: amount,
                visitType: 'OPD',
                bookedForMember: member ? { memberId: member._id, memberName: member.name, relation: member.relation } : null,
                paymentDetails: {
                    transactionId,
                    paymentStatus: 'pending'
                }
            };

            const response = await appointmentAPI.bookAppointment(bookingData);
            const appointmentId = response.data.appointment._id;

            // 2. Upload Screenshot
            setUploading(true);
            const formData = new FormData();
            formData.append('screenshot', selectedFile);
            await appointmentAPI.uploadPaymentScreenshot(appointmentId, formData);

            setSuccess(true);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Booking failed');
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    if (success) {
        return (
            <div className="booking-success">
                <div className="success-icon">✓</div>
                <h2>Appointment Requested!</h2>
                <p className="text-muted mb-lg">Your booking is being processed. Our team will verify your payment and confirm the slot shortly.</p>
                
                <div className="confirmation-card" style={{ textAlign: 'left', marginBottom: '2rem' }}>
                    <p><span>Doctor</span> <strong>Dr. {selectedDoctor.fullName}</strong></p>
                    <p><span>Date</span> <strong>{new Date(selectedDate).toLocaleDateString()}</strong></p>
                    <p><span>Time</span> <strong>{selectedSlot.startTime}</strong></p>
                </div>

                <div className="success-actions">
                    <button onClick={() => window.location.reload()} className="btn btn-primary">Book Another Appointment</button>
                    <button onClick={() => window.location.href='/patient/appointments'} className="btn btn-secondary mt-sm" style={{ width: '100%' }}>View My Appointments</button>
                </div>
            </div>
        );
    }

    return (
        <div className="book-appointment-stepper">
            <div className="stepper-header">
                {[1, 2, 3, 4, 5].map((s) => (
                    <div 
                        key={s} 
                        className={`step-dot ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}
                        title={`Step ${s}`}
                    >
                        {step > s ? '✓' : s}
                    </div>
                ))}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {step === 1 && (
                <div className="step-content">
                    <h2>Select Medical Department</h2>
                    <div className="department-grid">
                        {departments.map((dept) => (
                            <div key={dept} className="dept-section">
                                <h3 className="dept-title">{dept}</h3>
                                <div className="doctor-list">
                                    {doctors.filter(d => d.department === dept).map((doctor) => (
                                        <div key={doctor._id} className="doctor-card" onClick={() => handleDoctorSelect(doctor)}>
                                            <div className="doc-avatar">
                                                {doctor.fullName.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className="doc-info">
                                                <h4>Dr. {doctor.fullName}</h4>
                                                <p className="specialization">⭐ {doctor.specialization}</p>
                                                <p className="fee">Consultation: ₹{doctor.consultationFee || 500}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="step-content">
                    <h2>Preferred Date</h2>
                    <div className="date-selection-container">
                        <p className="mb-md text-muted">Scheduling for <strong>Dr. {selectedDoctor.fullName}</strong></p>
                        <input 
                            type="date" 
                            className="date-picker" 
                            min={new Date().toISOString().split('T')[0]}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        {selectedDate && sameDayCount > 0 && (
                            <div className={`day-limit-info ${sameDayCount >= maxSlots ? 'day-limit-full' : ''}`}>
                                📅 You have {sameDayCount} appointment(s) already booked for this day. 
                                (Limit: {maxSlots})
                            </div>
                        )}
                        <div className="step-actions mt-lg">
                            <button onClick={() => setStep(1)} className="btn btn-secondary">Back</button>
                            <button onClick={handleDateSelect} className="btn btn-primary" disabled={!selectedDate}>Next Step</button>
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="step-content">
                    <h2>Choose Your Slot</h2>
                    <div className="confirmation-wrapper">
                        <p className="text-center mb-lg">Available appointments on <strong>{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
                        {loading ? <div className="spinner" /> : (
                            <div className="slot-groups">
                                <div className="slot-group">
                                    <h4 className="slot-group-title">Available Times</h4>
                                    <div className="slots-grid">
                                        {availableSlots.length > 0 ? availableSlots.map((slot) => (
                                            <button 
                                                key={slot.startTime} 
                                                className={`slot-btn ${slot.isAvailable ? 'available' : 'booked'}`}
                                                disabled={!slot.isAvailable}
                                                onClick={() => handleSlotSelect(slot)}
                                            >
                                                {slot.startTime}
                                            </button>
                                        )) : <p className="text-center text-muted">No slots available for this date.</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="step-actions mt-lg">
                            <button onClick={() => setStep(2)} className="btn btn-secondary">Back</button>
                        </div>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="step-content">
                    <h2>Booking Confirmation</h2>
                    <div className="confirmation-wrapper">
                        <div className="family-selection mb-xl">
                            <p className="mb-md font-bold text-main">Who is this visit for?</p>
                            <div className="booked-for-grid">
                                <label className={`booked-for-option ${bookedFor === 'self' ? 'selected' : ''}`}>
                                    <input type="radio" name="bookedFor" checked={bookedFor === 'self'} onChange={() => setBookedFor('self')} />
                                    <span className="text-2xl">👤</span>
                                    <span className="font-bold">Myself</span>
                                </label>
                                {familyMembers.map(m => (
                                    <label key={m._id} className={`booked-for-option ${bookedFor === m._id ? 'selected' : ''}`}>
                                        <input type="radio" name="bookedFor" checked={bookedFor === m._id} onChange={() => setBookedFor(m._id)} />
                                        <span className="text-2xl">👨‍👩‍👧</span>
                                        <span className="font-bold">{m.name}</span>
                                        <span className="text-xs text-muted">{m.relation}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="confirmation-card">
                            <h3 className="mb-md text-main">Consultation Summary</h3>
                            <p><span>Doctor</span> <strong>Dr. {selectedDoctor.fullName}</strong></p>
                            <p><span>Department</span> <strong>{selectedDoctor.department}</strong></p>
                            <p><span>Date</span> <strong>{selectedDate}</strong></p>
                            <p><span>Time</span> <strong>{selectedSlot.startTime}</strong></p>
                            <p className="total-fee"><span>Total Payment</span> <strong>₹{selectedDoctor.consultationFee || 500}</strong></p>
                        </div>
                        
                        {bookedMemberIds.includes(bookedFor === 'self' ? null : bookedFor) && (
                            <div className="alert alert-error mb-md" style={{ padding: '8px 12px', fontSize: '13px' }}>
                                ⚠️ {bookedFor === 'self' ? 'You already have' : 'This member already has'} an appointment on this date.
                            </div>
                        )}
                        
                        <div className="step-actions mt-lg">
                            <button onClick={() => setStep(3)} className="btn btn-secondary">Back</button>
                            <button 
                                onClick={handleProceedToPayment} 
                                className="btn btn-primary"
                                disabled={bookedMemberIds.includes(bookedFor === 'self' ? null : bookedFor)}
                            >
                                Proceed to Pay ₹{selectedDoctor.consultationFee || 500}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 5 && (
                <div className="step-content">
                    <h2>Secure Payment</h2>
                    <div className="payment-container">
                        <div className="qr-container">
                            <p className="mb-md font-bold text-muted">Scan to Pay via UPI</p>
                            <img src={qrCodeUrl} alt="Payment QR Code" className="payment-qr" />
                            <div className="text-center">
                                <p className="text-lg font-bold text-main">₹{amount}</p>
                                <p className="text-sm text-muted">{upiId}</p>
                            </div>
                        </div>

                        <div className="payment-form">
                            <div className="payment-instructions mb-lg">
                                <h4 className="mb-sm text-main">Instructions:</h4>
                                <ol className="text-sm">
                                    <li>Open any UPI App (GPay, PhonePe, etc.)</li>
                                    <li>Scan the QR code or pay manually to the ID</li>
                                    <li>After payment, enter Transaction ID and upload screenshot</li>
                                </ol>
                            </div>

                            <div className="form-group mb-md">
                                <label className="block mb-xs text-sm font-bold text-main">Transaction ID / UTR *</label>
                                <input 
                                    type="text" 
                                    className="input w-full" 
                                    placeholder="Enter 12-digit UTR number"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                />
                            </div>

                            <div className="form-group mb-lg">
                                <label className="block mb-xs text-sm font-bold text-main">Payment Screenshot *</label>
                                <div className="screenshot-upload-box">
                                    <input 
                                        type="file" 
                                        className="input w-full" 
                                        accept="image/*"
                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                    />
                                    {selectedFile && <p className="text-xs text-success mt-xs">✓ {selectedFile.name} attached</p>}
                                </div>
                            </div>

                            <div className="step-actions" style={{ marginTop: '0', justifyContent: 'flex-start' }}>
                                <button onClick={() => setStep(4)} className="btn btn-secondary">Back</button>
                                <button 
                                    onClick={handleConfirmBooking} 
                                    className="btn btn-primary"
                                    disabled={loading || !transactionId || !selectedFile}
                                >
                                    {loading ? (uploading ? 'Finalizing...' : 'Processing...') : 'Confirm & Book Appointment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookAppointment;
