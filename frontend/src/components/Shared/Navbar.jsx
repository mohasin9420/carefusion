import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ onToggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <div className="navbar-brand">
                    <button className="mobile-toggle" onClick={onToggleSidebar}>
                        <i className="fa fa-bars"></i>
                    </button>
                    <i className="fa fa-clinic-medical brand-icon"></i>
                    <h2>CareFusion</h2>
                </div>

                <div className="navbar-actions">
                    <div className="user-profile-badge desktop-only">
                        <div className="user-info">
                            <span className="user-email">{user?.email}</span>
                            <span className="role-badge-pill">{user?.role}</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        <i className="fa fa-power-off"></i> <span className="desktop-only">Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
