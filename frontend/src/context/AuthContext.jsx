import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    // Restore user from sessionStorage so we don't flash "unauthorized" while getMe() runs on refresh
    const [user, setUser] = useState(() => {
        try {
            const stored = sessionStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = sessionStorage.getItem('token');
            console.log('🔍 Checking authentication...', token ? 'Token found' : 'No token');

            if (!token) {
                console.log('❌ No token in sessionStorage, user not authenticated');
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                console.log('🔄 Fetching current user from /auth/me...');
                const response = await authAPI.getMe();
                const freshUser = response.data.user;
                console.log('✅ User authenticated:', freshUser.email, '-', freshUser.role);
                setUser(freshUser);
                sessionStorage.setItem('user', JSON.stringify(freshUser));
            } catch (error) {
                console.error('❌ Authentication failed:', error.response?.data?.message || error.message);
                console.log('🗑️  Clearing invalid token from sessionStorage');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');
                setUser(null);
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        const response = await authAPI.login(email, password);
        const { token, user } = response.data;
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setUser(null);
    };

    const value = {
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
