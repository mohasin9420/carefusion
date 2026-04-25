import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './LandingPage.css';

const LandingPage = () => {
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        setAnimated(true);
    }, []);

    const roles = [
        {
            name: 'Patient',
            path: '/auth/patient',
            icon: '👨‍⚕️',
            color: '#4CAF50',
            description: 'Book appointments, view prescriptions, and access your medical records',
            features: ['Online Appointment Booking', 'Digital Prescriptions', 'Lab Reports Access']
        },
        {
            name: 'Doctor',
            path: '/auth/doctor',
            icon: '⚕️',
            color: '#2196F3',
            description: 'Manage your schedule, view patient appointments, and create prescriptions',
            features: ['Schedule Management', 'Patient Records', 'Prescription Writing']
        },
        {
            name: 'Staff',
            path: '/auth/staff',
            icon: '👥',
            color: '#FF9800',
            description: 'Manage doctor availability, handle daily queues, and coordinate operations',
            features: ['Doctor Scheduling', 'Queue Management', 'Slot Blocking']
        },
        {
            name: 'Pharmacy',
            path: '/auth/pharmacy',
            icon: '💊',
            color: '#9C27B0',
            description: 'Process prescriptions, manage inventory, and dispense medications',
            features: ['Prescription Processing', 'Inventory Management', 'Medicine Dispensing']
        },
        {
            name: 'Laboratory',
            path: '/auth/laboratory',
            icon: '🔬',
            color: '#00BCD4',
            description: 'Handle test requests, process samples, and upload reports',
            features: ['Test Processing', 'Report Management', 'Sample Tracking']
        },
        {
            name: 'Admin',
            path: '/auth/admin',
            icon: '🔐',
            color: '#F44336',
            description: 'Manage users, configure system settings, and monitor operations',
            features: ['User Management', 'System Configuration', 'Analytics Dashboard']
        },
    ];

    const systemFeatures = [
        {
            icon: '📅',
            title: 'Smart Scheduling',
            description: 'Slot-based appointment system with automated availability management'
        },
        {
            icon: '🏥',
            title: 'Complete EMR',
            description: 'Electronic medical records with prescriptions and lab reports'
        },
        {
            icon: '⚡',
            title: 'Real-Time Updates',
            description: 'Live queue status and appointment notifications'
        },
        {
            icon: '🔒',
            title: 'Secure & Private',
            description: 'Role-based access control and encrypted data storage'
        }
    ];

    const stats = [
        { value: '5000+', label: 'Patients Served' },
        { value: '50+', label: 'Specialist Doctors' },
        { value: '10000+', label: 'Appointments Booked' }
    ];

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className={`hero-section ${animated ? 'fade-in' : ''}`}>
                <div className="hero-content">
                    <div className="logo-container">
                        <span className="logo-icon">🏥</span>
                        <h1 className="hospital-name">CareFusion</h1>
                    </div>
                    <p className="tagline">Modern Healthcare Management System</p>
                    <p className="hero-description">
                        Streamline your hospital operations with our comprehensive digital solution.
                        From appointment scheduling to complete medical records management.
                    </p>

                    {/* Stats */}
                    <div className="stats-container">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-card">
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="hero-actions">
                        <a href="#roles" className="btn btn-primary btn-large">Get Started</a>
                        <a href="#features" className="btn btn-secondary btn-large">Learn More</a>
                    </div>
                </div>

                <div className="hero-background">
                    <div className="gradient-orb orb-1"></div>
                    <div className="gradient-orb orb-2"></div>
                    <div className="gradient-orb orb-3"></div>
                </div>
            </section>

            {/* Role Selection Section */}
            <section id="roles" className="roles-section">
                <div className="section-header">
                    <h2 className="section-title">Select Your Role</h2>
                    <p className="section-subtitle">Choose your portal and login or register to get started</p>
                </div>

                <div className="role-grid">
                    {roles.map((role, index) => (
                        <div
                            key={role.name}
                            className="role-card-static"
                            style={{
                                '--role-color': role.color,
                                animationDelay: `${index * 0.1}s`,
                                borderColor: role.color
                            }}
                        >
                            <div className="role-icon" style={{ color: role.color }}>
                                {role.icon}
                            </div>
                            <h3 className="role-name">{role.name}</h3>
                            <p className="role-description">{role.description}</p>
                            <ul className="role-features">
                                {role.features.map((feature, idx) => (
                                    <li key={idx}>
                                        <span className="feature-bullet">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <div className="role-actions-buttons">
                                <Link to="/login" className="role-btn role-btn-primary">Login</Link>
                                {role.name !== 'Admin' && (
                                    <Link to="/register" className="role-btn role-btn-secondary">Register</Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Showcase */}
            <section id="features" className="features-section">
                <div className="section-header">
                    <h2 className="section-title">Why Choose CareFusion?</h2>
                    <p className="section-subtitle">Powerful features for modern healthcare</p>
                </div>

                <div className="features-grid">
                    {systemFeatures.map((feature, index) => (
                        <div key={index} className="feature-card">
                            <div className="feature-icon">{feature.icon}</div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>CareFusion</h4>
                        <p>Transforming healthcare management</p>
                    </div>
                    <div className="footer-section">
                        <h4>Quick Links</h4>
                        <a href="#roles">Select Role</a>
                        <a href="#features">Features</a>
                        <a href="/forgot-password">Forgot Password</a>
                    </div>
                    <div className="footer-section">
                        <h4>Support</h4>
                        <a href="#">Help Center</a>
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                    </div>
                    <div className="footer-section">
                        <h4>Contact</h4>
                        <p>Email: support@carefusion.com</p>
                        <p>Phone: +91 123 456 7890</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 CareFusion Hospital Management System. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
