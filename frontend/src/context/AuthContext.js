'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

function decodeJWTPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('svt_token');
    const storedUser = localStorage.getItem('svt_user');
    if (storedToken) {
      const payload = decodeJWTPayload(storedToken);
      if (payload && payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('svt_token');
        localStorage.removeItem('svt_user');
      } else {
        setToken(storedToken);
        if (storedUser) {
          try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ }
        } else if (payload) {
          setUser({
            id: payload.userId,
            email: payload.email,
            role: payload.role,
          });
        }
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    const { token: newToken, user: userData } = data;
    localStorage.setItem('svt_token', newToken);
    localStorage.setItem('svt_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('svt_token');
    localStorage.removeItem('svt_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
