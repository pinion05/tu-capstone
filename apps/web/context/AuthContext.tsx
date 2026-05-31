'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, TokenResponse, AuthState } from '../types/auth';
import { apiFetch } from '../lib/api';
import { ENDPOINTS } from '../lib/endpoints';

interface AuthContextType extends AuthState {
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const refreshUser = useCallback(async () => {
    try {
      const user = await apiFetch<User>(ENDPOINTS.AUTH.ME);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      localStorage.removeItem('accessToken');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      refreshUser();
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [refreshUser]);

  const login = useCallback(async (email: string) => {
    try {
      const { accessToken } = await apiFetch<TokenResponse>(
        `${ENDPOINTS.AUTH.LOGIN_TEMP}?email=${encodeURIComponent(email)}`, 
        { method: 'POST' }
      );
      localStorage.setItem('accessToken', accessToken);
      await refreshUser();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await apiFetch(ENDPOINTS.AUTH.LOGOUT, { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('accessToken');
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
