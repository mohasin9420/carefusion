import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    console.log('🛡️  ProtectedRoute check:', {
        loading,
        hasUser: !!user,
        userRole: user?.role,
        allowedRoles,
        isAuthorized: user && allowedRoles ? allowedRoles.includes(user.role) : 'no check'
    });

    if (loading) {
        console.log('⏳ Still loading authentication...');
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    if (!user) {
        console.log('❌ No user found, redirecting to home');
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        console.error('🚫 UNAUTHORIZED:', {
            userRole: user.role,
            allowedRoles,
            message: `User with role '${user.role}' cannot access route that requires: ${allowedRoles.join(', ')}`
        });
        return <Navigate to="/unauthorized" replace />;
    }

    console.log('✅ User authorized for this route');
    return children;
};

export default ProtectedRoute;
