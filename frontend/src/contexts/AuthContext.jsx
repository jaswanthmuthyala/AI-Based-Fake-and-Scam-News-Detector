import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { Loader2, ShieldCheck } from 'lucide-react';

// Configure Axios globally

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const checkAuth = async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    await api.post('/api/auth/login', { email, password });
    await checkAuth();
  };

  const register = async (name, email, password) => {
    await api.post('/api/auth/register', { name, email, password });
  };
const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.warn("Server-side logout failed, performing safe local fallback:", err);
      if (err.isNetworkError) {
        alert("Warning: Could not connect to the server to invalidate your session remotely. You have been signed out locally. Please close your browser completely to protect your session.");
      }
    } finally {
      // Always clear local state
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-classic-pageBg">
        <div className="w-16 h-16 bg-classic-surfaceElevated border border-classic-border rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <ShieldCheck size={32} className="text-classic-gold" />
        </div>
        <Loader2 size={24} className="animate-spin text-classic-muted mb-4" />
        <p className="text-sm font-medium text-classic-secondary tracking-wide uppercase">Securing Connection...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
