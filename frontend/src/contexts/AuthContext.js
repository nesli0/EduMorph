import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        const initializeAuth = async () => {
            if (token) {
                try {
                    const userData = await authService.getCurrentUser();
                    setUser(userData);
                } catch (error) {
                    console.error('Token geçersiz:', error);
                    localStorage.removeItem('token');
                    setToken(null);
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, [token]);

    const login = async (username, password) => {
        try {
            const response = await authService.login(username, password);
            const { access_token } = response;
            
            localStorage.setItem('token', access_token);
            setToken(access_token);
            
            const userData = await authService.getCurrentUser();
            setUser(userData);
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (userData) => {
        try {
            const response = await authService.register(userData);
            const { access_token } = response;
            
            localStorage.setItem('token', access_token);
            setToken(access_token);
            
            const user = await authService.getCurrentUser();
            setUser(user);
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
