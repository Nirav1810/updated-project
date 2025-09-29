import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { auth } from '../services/api';
import { User, AuthResponse } from '../types';

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (data: { enrollmentNo?: string, email?: string; password: string }) => Promise<void>;
  register: (data: {
    enrollmentNo?: string;
    email: string;
    password: string;
    fullName: string;
    role: 'student' | 'teacher' | 'admin';
    classYear?: string;
    semester?: string;
    faceEmbedding?: number[];
  }) => Promise<void>;
  forgotPassword: (data: { email?: string; enrollmentNo?: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to handle a successful authentication
  const handleAuthSuccess = async (response: AuthResponse) => {
    const { token, user: aUser } = response;
    if (!token || !aUser) {
      throw new Error('Invalid response from server');
    }
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(aUser));
    await SecureStore.setItemAsync('role', aUser.role);
    setUser(aUser);
    setIsAuthenticated(true);
  };

  const checkAuthState = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const userData = await SecureStore.getItemAsync('user');

      if (token && userData) {
        const parsedUser = JSON.parse(userData) as User;
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to check auth state, clearing session.', error);
      await logout(); // Clear any partial/corrupted data
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  const login = async (data: { enrollmentNo?: string, email?: string; password: string }) => {
    try {
      const response = await auth.login(data);
      await handleAuthSuccess(response);
    } catch (error: any) {
      console.error('Login error:', error.message);
      throw error; // Re-throw the error for the UI to handle
    }
  };

  const register = async (data: {
    enrollmentNo?: string;
    email: string;
    password: string;
    fullName: string;
    role: 'student' | 'teacher' | 'admin';
    faceEmbedding?: number[];
  }) => {
    try {
      const response = await auth.register(data);
      await handleAuthSuccess(response);
    } catch (error: any) {
      console.error('Registration error:', error.message);
      throw error; // Re-throw the error for the UI to handle
    }
  };

  const forgotPassword = async (data: {
    enrollmentNo?: string;
    email?: string;
  }) => {
    try {
      const response = await auth.forgotPassword(data);
    } catch (error: any) {
      console.error('Forgot Password error:', error.message);
      throw error;
    }
  };

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('role');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, register, forgotPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
