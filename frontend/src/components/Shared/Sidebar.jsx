import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ links, isOpen, onClose }) => {
    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && <div className="sidebar-backdrop" onClick={onClose}></div>}
            
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <nav className="sidebar-nav">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                            onClick={() => {
                                if (window.innerWidth <= 768) {
                                    onClose();
                                }
                            }}
                        >
                            {link.icon && <span className="sidebar-icon">{link.icon}</span>}
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
