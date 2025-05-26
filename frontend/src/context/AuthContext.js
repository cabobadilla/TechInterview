import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

const AuthContext = createContext();

// Configure axios baseURL based on environment
const api = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

console.log('🔧 API configured with base URL:', `${API_CONFIG.BASE_URL}/api`);

// Add interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      hasToken: !!token
    });
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔄 AuthProvider initializing...');
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      console.log('🎫 Found existing token, verifying...');
      // Verify token with backend
      verifyToken(token);
    } else {
      console.log('🚫 No token found in localStorage');
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      console.log('🔍 Verifying token with backend...');
      const response = await api.get('/auth/verify');
      
      if (response.data.user) {
        console.log('✅ Token verification successful:', response.data.user);
        setUser(response.data.user);
      } else {
        console.log('❌ Token verification failed: no user data');
        // Token invalid, remove from storage
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error('❌ Error verifying token:', err);
      localStorage.removeItem('token');
      setError('Session expired. Please log in again.');
    } finally {
      setLoading(false);
    }
  };

  const login = async (googleToken) => {
    try {
      console.log('🚀 Starting login process...');
      console.log('🎫 Google token received:', googleToken ? 'Present' : 'Missing');
      
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/google', { token: googleToken });
      
      console.log('✅ Login successful:', response.data);
      
      // Save token to localStorage
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      
      return response.data.user;
    } catch (err) {
      console.error('❌ Login error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to login with Google';
      console.error('❌ Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('👋 Logging out...');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user,
        api
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 