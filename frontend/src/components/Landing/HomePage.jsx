import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../../services/api';
import { getProfileImageUrl } from '../../utils/imageUtils';

const HomePage = () => {
    const [doctors, setDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await publicAPI.getDoctors();
                setDoctors(response.data || []);
            } catch (error) {
                console.error('Error fetching doctors:', error);
            } finally {
                setLoadingDoctors(false);
            }
        };
        fetchDoctors();
    }, []);

    // Effect to initialize Owl Carousel after doctors are loaded
    useEffect(() => {
        if (!loadingDoctors && window.jQuery && doctors.length > 0) {
            const $ = window.jQuery;
            
            // Re-initialize carousels
            $(".price-carousel").owlCarousel({
                autoplay: true,
                smartSpeed: 1000,
                margin: 45,
                dots: false,
                loop: true,
                nav: true,
                navText: [
                    '<i class="bi bi-arrow-left"></i>',
                    '<i class="bi bi-arrow-right"></i>'
                ],
                responsive: {
                    0: { items: 1 },
                    992: { items: 2 },
                    1200: { items: 3 }
                }
            });

            $(".team-carousel").owlCarousel({
                autoplay: true,
                smartSpeed: 1000,
                margin: 45,
                dots: false,
                loop: true,
                nav: true,
                navText: [
                    '<i class="bi bi-arrow-left"></i>',
                    '<i class="bi bi-arrow-right"></i>'
                ],
                responsive: {
                    0: { items: 1 },
                    992: { items: 2 }
                }
            });

            $(".testimonial-carousel").owlCarousel({
                autoplay: true,
                smartSpeed: 1000,
                items: 1,
                dots: true,
                loop: true,
            });
        }
    }, [loadingDoctors, doctors]);

    // Departments for selection (dynamic from doctors)
    const departments = [...new Set(doctors.map(d => d.department))];

    return (
        <div className="medinova-homepage">
            {/* Topbar Start */}
            <div className="container-fluid py-2 border-bottom d-none d-lg-block">
                <div className="container">
                    <div className="row">
                        <div className="col-md-6 text-center text-lg-start mb-2 mb-lg-0">
                            <div className="d-inline-flex align-items-center">
                                <a className="text-decoration-none text-body pe-3" href="tel:+0123456789">
                                    <i className="bi bi-telephone me-2"></i>+91 8888764131
                                </a>
                                <span className="text-body">|</span>
                                <a className="text-decoration-none text-body px-3" href="mailto:info@example.com">
                                    <i className="bi bi-envelope me-2"></i>info@carefusion.com
                                </a>
                            </div>
                        </div>
                        <div className="col-md-6 text-center text-lg-end">
                            <div className="d-inline-flex align-items-center">
                                <Link to="/login?role=admin" className="text-body px-2" title="Admin Login">
                                    <i className="fa fa-user-shield"></i>
                                </Link>
                                <a className="text-body px-2" href="#"><i className="fab fa-facebook-f"></i></a>
                                <a className="text-body px-2" href="#"><i className="fab fa-twitter"></i></a>
                                <a className="text-body px-2" href="#"><i className="fab fa-linkedin-in"></i></a>
                                <a className="text-body px-2" href="#"><i className="fab fa-instagram"></i></a>
                                <a className="text-body ps-2" href="#"><i className="fab fa-youtube"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Topbar End */}

            {/* Navbar Start */}
            <div className="container-fluid sticky-top bg-white shadow-sm">
                <div className="container">
                    <nav className="navbar navbar-expand-lg bg-white navbar-light py-3 py-lg-0">
                        <Link to="/" className="navbar-brand">
                            <h1 className="m-0 text-uppercase text-primary"><i className="fa fa-clinic-medical me-2"></i>Carefusion</h1>
                        </Link>
                        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
                            <span className="navbar-toggler-icon"></span>
                        </button>
                        <div className="collapse navbar-collapse" id="navbarCollapse">
                            <div className="navbar-nav ms-auto py-0">
                                <a href="#home" className="nav-item nav-link active">Home</a>
                                <a href="#about" className="nav-item nav-link">About</a>
                                <a href="#service" className="nav-item nav-link">Service</a>
                                <Link to="/login" className="nav-item nav-link" style={{color: '#13C5DD', fontWeight: 'bold'}}>Login</Link>
                                <Link to="/register" className="nav-item nav-link" style={{color: '#354F8E', fontWeight: 'bold'}}>Register</Link>
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
            {/* Navbar End */}

            {/* Hero Start */}
            <div id="home" className="container-fluid bg-primary py-5 mb-5 hero-header">
                <div className="container py-5">
                    <div className="row justify-content-start">
                        <div className="col-lg-8 text-center text-lg-start">
                            <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5" style={{ borderColor: 'rgba(256, 256, 256, .3) !important' }}>Welcome To Carefusion</h5>
                            <h1 className="display-1 text-white mb-md-4">Best Healthcare Solution In Your City</h1>
                            <div className="pt-2">
                                <Link to="/register" className="btn btn-light rounded-pill py-md-3 px-md-5 mx-2">Find Doctor</Link>
                                <Link to="/register" className="btn btn-outline-light rounded-pill py-md-3 px-md-5 mx-2">Appointment</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Hero End */}

            {/* About Start */}
            <div id="about" className="container-fluid py-5">
                <div className="container">
                    <div className="row gx-5">
                        <div className="col-lg-5 mb-5 mb-lg-0" style={{ minHeight: '500px' }}>
                            <div className="position-relative h-100">
                                <img className="position-absolute w-100 h-100 rounded" src="/medinova/img/about.jpg" style={{ objectFit: 'cover' }} alt="About" />
                            </div>
                        </div>
                        <div className="col-lg-7">
                            <div className="mb-4">
                                <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">About Us</h5>
                                <h1 className="display-4">Best Medical Care For Yourself and Your Family</h1>
                            </div>
                            <p>Carefusion is committed to providing world-class healthcare services. Our facilities are equipped with the latest medical technology, and our team of highly qualified doctors ensures that you receive the best possible care.</p>
                            <div className="row g-3 pt-3">
                                <div className="col-sm-3 col-6">
                                    <div className="bg-light text-center rounded-circle py-4">
                                        <i className="fa fa-3x fa-user-md text-primary mb-3"></i>
                                        <h6 className="mb-0">Qualified<small className="d-block text-primary">Doctors</small></h6>
                                    </div>
                                </div>
                                <div className="col-sm-3 col-6">
                                    <div className="bg-light text-center rounded-circle py-4">
                                        <i className="fa fa-3x fa-procedures text-primary mb-3"></i>
                                        <h6 className="mb-0">Emergency<small className="d-block text-primary">Services</small></h6>
                                    </div>
                                </div>
                                <div className="col-sm-3 col-6">
                                    <div className="bg-light text-center rounded-circle py-4">
                                        <i className="fa fa-3x fa-microscope text-primary mb-3"></i>
                                        <h6 className="mb-0">Accurate<small className="d-block text-primary">Testing</small></h6>
                                    </div>
                                </div>
                                <div className="col-sm-3 col-6">
                                    <div className="bg-light text-center rounded-circle py-4">
                                        <i className="fa fa-3x fa-ambulance text-primary mb-3"></i>
                                        <h6 className="mb-0">Free<small className="d-block text-primary">Ambulance</small></h6>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* About End */}

            {/* Services Start */}
            <div id="service" className="container-fluid py-5">
                <div className="container">
                    <div className="text-center mx-auto mb-5" style={{ maxWidth: '500px' }}>
                        <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">Services</h5>
                        <h1 className="display-4">Excellent Medical Services</h1>
                    </div>
                    <div className="row g-5">
                        <div className="col-lg-4 col-md-6">
                            <div className="service-item bg-light rounded d-flex flex-column align-items-center justify-content-center text-center">
                                <div className="service-icon mb-4">
                                    <i className="fa fa-2x fa-user-md text-white"></i>
                                </div>
                                <h4 className="mb-3">Emergency Care</h4>
                                <p className="m-0">24/7 emergency response with a dedicated team of trauma specialists and advanced life support.</p>
                                <Link className="btn btn-lg btn-primary rounded-pill" to="/register">
                                    <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="service-item bg-light rounded d-flex flex-column align-items-center justify-content-center text-center">
                                <div className="service-icon mb-4">
                                    <i className="fa fa-2x fa-procedures text-white"></i>
                                </div>
                                <h4 className="mb-3">Operation & Surgery</h4>
                                <p className="m-0">Modern surgical suites equipped for complex procedures with minimal invasive technology.</p>
                                <Link className="btn btn-lg btn-primary rounded-pill" to="/register">
                                    <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="service-item bg-light rounded d-flex flex-column align-items-center justify-content-center text-center">
                                <div className="service-icon mb-4">
                                    <i className="fa fa-2x fa-stethoscope text-white"></i>
                                </div>
                                <h4 className="mb-3">Outdoor Checkup</h4>
                                <p className="m-0">Efficient OPD services with top consultants across various specialties for daily healthcare.</p>
                                <Link className="btn btn-lg btn-primary rounded-pill" to="/register">
                                    <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="service-item bg-light rounded d-flex flex-column align-items-center justify-content-center text-center">
                                <div className="service-icon mb-4">
                                    <i className="fa fa-2x fa-ambulance text-white"></i>
                                </div>
                                <h4 className="mb-3">Ambulance Service</h4>
                                <p className="m-0">Fully equipped ambulances available on call to provide immediate medical assistance.</p>
                                <Link className="btn btn-lg btn-primary rounded-pill" to="/register">
                                    <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="service-item bg-light rounded d-flex flex-column align-items-center justify-content-center text-center">
                                <div className="service-icon mb-4">
                                    <i className="fa fa-2x fa-pills text-white"></i>
                                </div>
                                <h4 className="mb-3">Medicine & Pharmacy</h4>
                                <p className="m-0">In-house pharmacy providing authentic medicines and pharmaceutical care 24/7.</p>
                                <Link className="btn btn-lg btn-primary rounded-pill" to="/register">
                                    <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="service-item bg-light rounded d-flex flex-column align-items-center justify-content-center text-center">
                                <div className="service-icon mb-4">
                                    <i className="fa fa-2x fa-microscope text-white"></i>
                                </div>
                                <h4 className="mb-3">Blood Testing</h4>
                                <p className="m-0">Accurate diagnostic laboratory services with international quality standards and fast results.</p>
                                <Link className="btn btn-lg btn-primary rounded-pill" to="/register">
                                    <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Services End */}

            {/* Appointment Start */}
            <div className="container-fluid bg-primary my-5 py-5">
                <div className="container py-5">
                    <div className="row gx-5">
                        <div className="col-lg-6 mb-5 mb-lg-0">
                            <div className="mb-4">
                                <h5 className="d-inline-block text-white text-uppercase border-bottom border-5">Appointment</h5>
                                <h1 className="display-4">Make An Appointment For Your Family</h1>
                            </div>
                            <p className="text-white mb-5">Booking an appointment at Carefusion is simple. Choose your preferred department and doctor to get started. Our team will verify and confirm your consultation shortly.</p>
                            <Link className="btn btn-dark rounded-pill py-3 px-5 me-3" to="/register">Find Doctor</Link>
                            <Link className="btn btn-outline-dark rounded-pill py-3 px-5" to="/register">Read More</Link>
                        </div>
                        <div className="col-lg-6">
                            <div className="bg-white text-center rounded p-5">
                                <h1 className="mb-4">Book An Appointment</h1>
                                <form onSubmit={(e) => { e.preventDefault(); window.location.href = '/register'; }}>
                                    <div className="row g-3">
                                        <div className="col-12 col-sm-6">
                                            <select className="form-select bg-light border-0" style={{ height: '55px' }}>
                                                <option defaultValue>Choose Department</option>
                                                {departments.map((dept, i) => <option key={i} value={dept}>{dept}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <select className="form-select bg-light border-0" style={{ height: '55px' }}>
                                                <option defaultValue>Select Doctor</option>
                                                {doctors.map(doc => <option key={doc._id} value={doc._id}>{doc.fullName}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <input type="text" className="form-control bg-light border-0" placeholder="Your Name" style={{ height: '55px' }} />
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <input type="email" className="form-control bg-light border-0" placeholder="Your Email" style={{ height: '55px' }} />
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="date" id="date" data-target-input="nearest">
                                                <input type="text" className="form-control bg-light border-0 datetimepicker-input" placeholder="Date" data-target="#date" data-toggle="datetimepicker" style={{ height: '55px' }} />
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="time" id="time" data-target-input="nearest">
                                                <input type="text" className="form-control bg-light border-0 datetimepicker-input" placeholder="Time" data-target="#time" data-toggle="datetimepicker" style={{ height: '55px' }} />
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <button className="btn btn-primary w-100 py-3" type="submit">Make An Appointment</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Appointment End */}

            {/* Pricing Plan Start */}
            <div className="container-fluid py-5">
                <div className="container">
                    <div className="text-center mx-auto mb-5" style={{ maxWidth: '500px' }}>
                        <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">Medical Packages</h5>
                        <h1 className="display-4">Awesome Medical Programs</h1>
                    </div>
                    <div className="owl-carousel price-carousel position-relative" style={{ padding: '0 45px 45px 45px' }}>
                        <div className="bg-light rounded text-center">
                            <div className="position-relative">
                                <img className="img-fluid rounded-top" src="/medinova/img/price-1.jpg" alt="" />
                                <div className="position-absolute w-100 h-100 top-50 start-50 translate-middle rounded-top d-flex flex-column align-items-center justify-content-center" style={{ background: 'rgba(29, 42, 77, .8)' }}>
                                    <h3 className="text-white">Pregnancy Care</h3>
                                    <h1 className="display-4 text-white mb-0">
                                        <small className="align-top fw-normal" style={{ fontSize: '22px', lineHeight: '45px' }}>₹</small>4999<small className="align-bottom fw-normal" style={{ fontSize: '16px', lineHeight: '40px' }}>/ Year</small>
                                    </h1>
                                </div>
                            </div>
                            <div className="text-center py-5">
                                <p>Emergency Medical Treatment</p>
                                <p>Highly Experienced Doctors</p>
                                <p>Highest Success Rate</p>
                                <p>Telephone Service</p>
                                <Link to="/register" className="btn btn-primary rounded-pill py-3 px-5 my-2">Apply Now</Link>
                            </div>
                        </div>
                        <div className="bg-light rounded text-center">
                            <div className="position-relative">
                                <img className="img-fluid rounded-top" src="/medinova/img/price-2.jpg" alt="" />
                                <div className="position-absolute w-100 h-100 top-50 start-50 translate-middle rounded-top d-flex flex-column align-items-center justify-content-center" style={{ background: 'rgba(29, 42, 77, .8)' }}>
                                    <h3 className="text-white">Health Checkup</h3>
                                    <h1 className="display-4 text-white mb-0">
                                        <small className="align-top fw-normal" style={{ fontSize: '22px', lineHeight: '45px' }}>₹</small>999<small className="align-bottom fw-normal" style={{ fontSize: '16px', lineHeight: '40px' }}>/ Year</small>
                                    </h1>
                                </div>
                            </div>
                            <div className="text-center py-5">
                                <p>Emergency Medical Treatment</p>
                                <p>Highly Experienced Doctors</p>
                                <p>Highest Success Rate</p>
                                <p>Telephone Service</p>
                                <Link to="/register" className="btn btn-primary rounded-pill py-3 px-5 my-2">Apply Now</Link>
                            </div>
                        </div>
                        <div className="bg-light rounded text-center">
                            <div className="position-relative">
                                <img className="img-fluid rounded-top" src="/medinova/img/price-3.jpg" alt="" />
                                <div className="position-absolute w-100 h-100 top-50 start-50 translate-middle rounded-top d-flex flex-column align-items-center justify-content-center" style={{ background: 'rgba(29, 42, 77, .8)' }}>
                                    <h3 className="text-white">Dental Care</h3>
                                    <h1 className="display-4 text-white mb-0">
                                        <small className="align-top fw-normal" style={{ fontSize: '22px', lineHeight: '45px' }}>₹</small>1499<small className="align-bottom fw-normal" style={{ fontSize: '16px', lineHeight: '40px' }}>/ Year</small>
                                    </h1>
                                </div>
                            </div>
                            <div className="text-center py-5">
                                <p>Emergency Medical Treatment</p>
                                <p>Highly Experienced Doctors</p>
                                <p>Highest Success Rate</p>
                                <p>Telephone Service</p>
                                <Link to="/register" className="btn btn-primary rounded-pill py-3 px-5 my-2">Apply Now</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Pricing Plan End */}

            {/* Team Start */}
            <div className="container-fluid py-5">
                <div className="container">
                    <div className="text-center mx-auto mb-5" style={{ maxWidth: '500px' }}>
                        <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">Our Doctors</h5>
                        <h1 className="display-4">Qualified Healthcare Professionals</h1>
                    </div>
                    {loadingDoctors ? (
                        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                    ) : (
                        <div className="owl-carousel team-carousel position-relative">
                            {doctors.map(doctor => (
                                <div key={doctor._id} className="team-item">
                                    <div className="row g-0 bg-light rounded overflow-hidden">
                                        <div className="col-12 col-sm-5 h-100">
                                            <img
                                                className="img-fluid h-100"
                                                src={getProfileImageUrl(doctor.profilePicture) || `/medinova/img/team-1.jpg`}
                                                style={{ objectFit: 'cover', objectPosition: 'center top' }}
                                                alt={doctor.fullName}
                                                onError={e => { e.target.src = '/medinova/img/team-1.jpg'; }}
                                            />
                                        </div>
                                        <div className="col-12 col-sm-7 h-100 d-flex flex-column">
                                            <div className="mt-auto p-4">
                                                <h3>{doctor.fullName}</h3>
                                                <h6 className="fw-normal fst-italic text-primary mb-4">{doctor.specialization}</h6>
                                                <p className="m-0">{doctor.qualification} with {doctor.experience} years of experience.</p>
                                            </div>
                                            <div className="d-flex mt-auto border-top p-4">
                                                <a className="btn btn-lg btn-primary btn-lg-square rounded-circle me-3" href="#"><i className="fab fa-twitter"></i></a>
                                                <a className="btn btn-lg btn-primary btn-lg-square rounded-circle me-3" href="#"><i className="fab fa-facebook-f"></i></a>
                                                <a className="btn btn-lg btn-primary btn-lg-square rounded-circle" href="#"><i className="fab fa-linkedin-in"></i></a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* Team End */}

            {/* Footer Start */}
            <div className="container-fluid bg-dark text-light mt-5 py-5">
                <div className="container py-5">
                    <div className="row g-5">
                        <div className="col-lg-3 col-md-6">
                            <h4 className="d-inline-block text-primary text-uppercase border-bottom border-5 border-secondary mb-4">Get In Touch</h4>
                            <p className="mb-4">Carefusion Hospital - Your partner in health since 1999.</p>
                            <p className="mb-2"><i className="fa fa-map-marker-alt text-primary me-3"></i>123 Street, Healthcare City, India</p>
                            <p className="mb-2"><i className="fa fa-envelope text-primary me-3"></i>info@carefusion.com</p>
                            <p className="mb-0"><i className="fa fa-phone-alt text-primary me-3"></i>+012 345 67890</p>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <h4 className="d-inline-block text-primary text-uppercase border-bottom border-5 border-secondary mb-4">Quick Links</h4>
                            <div className="d-flex flex-column justify-content-start">
                                <Link className="text-light mb-2" to="/"><i className="fa fa-angle-right me-2"></i>Home</Link>
                                <a className="text-light mb-2" href="#about"><i className="fa fa-angle-right me-2"></i>About Us</a>
                                <a className="text-light mb-2" href="#service"><i className="fa fa-angle-right me-2"></i>Our Services</a>
                                <Link className="text-light" to="/register"><i className="fa fa-angle-right me-2"></i>Contact Us</Link>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <h4 className="d-inline-block text-primary text-uppercase border-bottom border-5 border-secondary mb-4">Popular Links</h4>
                            <div className="d-flex flex-column justify-content-start">
                                <Link className="text-light mb-2" to="/login"><i className="fa fa-angle-right me-2"></i>Login</Link>
                                <Link className="text-light mb-2" to="/register"><i className="fa fa-angle-right me-2"></i>Register</Link>
                                <Link className="text-light mb-2" to="/login?role=admin"><i className="fa fa-angle-right me-2"></i>Admin Dashboard</Link>
                                <Link className="text-light mb-2" to="/verify-claim"><i className="fa fa-angle-right me-2"></i>Verify Insurance</Link>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <h4 className="d-inline-block text-primary text-uppercase border-bottom border-5 border-secondary mb-4">Newsletter</h4>
                            <form action="">
                                <div className="input-group">
                                    <input type="text" className="form-control p-3 border-0" placeholder="Your Email Address" />
                                    <button className="btn btn-primary">Sign Up</button>
                                </div>
                            </form>
                            <h6 className="text-primary text-uppercase mt-4 mb-3">Follow Us</h6>
                            <div className="d-flex">
                                <a className="btn btn-lg btn-primary btn-lg-square rounded-circle me-2" href="#"><i className="fab fa-twitter"></i></a>
                                <a className="btn btn-lg btn-primary btn-lg-square rounded-circle me-2" href="#"><i className="fab fa-facebook-f"></i></a>
                                <a className="btn btn-lg btn-primary btn-lg-square rounded-circle me-2" href="#"><i className="fab fa-linkedin-in"></i></a>
                                <a className="btn btn-lg btn-primary btn-lg-square rounded-circle" href="#"><i className="fab fa-instagram"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer End */}

            {/* Back to Top */}
            <a href="#" className="btn btn-lg btn-primary btn-lg-square back-to-top"><i className="bi bi-arrow-up"></i></a>
        </div>
    );
};

export default HomePage;
