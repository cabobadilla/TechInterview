import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

const AuthContext = createContext();

// Global logging system
let globalLogHandler = null;

export const setGlobalLogHandler = (handler) => {
  globalLogHandler = handler;
};

const addGlobalLog = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [${type.toUpperCase()}]`, message);
  if (globalLogHandler) {
    globalLogHandler(message, type);
  }
};

// Configure axios baseURL based on environment
const api = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000, // 30 seconds timeout
  withCredentials: true
});

addGlobalLog(`🔧 API configured with base URL: ${API_CONFIG.BASE_URL}/api`, 'info');
addGlobalLog(`⏱️ Request timeout set to 30 seconds`, 'info');

// Add interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    addGlobalLog(`📤 API Request: ${config.method?.toUpperCase()} ${config.url} (Token: ${!!token})`, 'info');
    return config;
  },
  (error) => {
    addGlobalLog(`❌ API Request Error: ${error.message}`, 'error');
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    addGlobalLog(`📥 API Response: ${response.status} ${response.config.url}`, 'success');
    return response;
  },
  (error) => {
    const status = error.response?.status || 'No Response';
    const url = error.config?.url || 'Unknown URL';
    const errorData = error.response?.data || {};
    const errorMessage = errorData.error || error.message || 'Unknown error';
    
    addGlobalLog(`❌ API Response Error: ${status} ${url} - ${errorMessage}`, 'error');
    
    // Add more detailed error information
    if (error.code === 'ERR_NETWORK') {
      addGlobalLog(`🌐 Network Error: Cannot connect to backend at ${API_CONFIG.BASE_URL}`, 'error');
      addGlobalLog(`🔍 Possible causes: Backend down, CORS issue, or network connectivity`, 'warning');
    } else if (error.code === 'ECONNREFUSED') {
      addGlobalLog(`🔌 Connection Refused: Backend server is not responding`, 'error');
    } else if (error.code === 'ECONNABORTED') {
      addGlobalLog(`⏰ Request Timeout: Request took longer than 30 seconds`, 'error');
    } else if (status === 404) {
      addGlobalLog(`🔍 Not Found: Endpoint ${url} does not exist`, 'error');
    } else if (status === 500) {
      addGlobalLog(`💥 Server Error: Backend internal error`, 'error');
    } else if (status === 0) {
      addGlobalLog(`🚫 CORS Error: Cross-origin request blocked`, 'error');
    }
    
    return Promise.reject(error);
  }
);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    addGlobalLog('🔄 AuthProvider initializing...', 'info');
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      addGlobalLog('🎫 Found existing token, verifying...', 'info');
      // Verify token with backend
      verifyToken(token);
    } else {
      addGlobalLog('🚫 No token found in localStorage', 'info');
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      addGlobalLog('🔍 Verifying token with backend...', 'info');
      const response = await api.get('/auth/verify');
      
      if (response.data.user) {
        addGlobalLog(`✅ Token verification successful: ${response.data.user.email || 'User'}`, 'success');
        setUser(response.data.user);
      } else {
        addGlobalLog('❌ Token verification failed: no user data', 'warning');
        // Token invalid, remove from storage
        localStorage.removeItem('token');
      }
    } catch (err) {
      addGlobalLog(`❌ Error verifying token: ${err.message}`, 'error');
      localStorage.removeItem('token');
      setError('Session expired. Please log in again.');
    } finally {
      setLoading(false);
    }
  };

  const login = async (googleToken) => {
    try {
      addGlobalLog('🚀 Starting login process...', 'info');
      addGlobalLog(`🎫 Google token received: ${googleToken ? 'Present' : 'Missing'}`, 'info');
      
      setLoading(true);
      setError(null);
      
      // Test connectivity first
      addGlobalLog('🔗 Testing backend connectivity...', 'info');
      
      const response = await api.post('/auth/google', { token: googleToken });
      
      addGlobalLog(`✅ Login successful: ${response.data.user?.email || 'User'}`, 'success');
      
      // Save token to localStorage
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      
      return response.data.user;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to login with Google';
      addGlobalLog(`❌ Login error: ${errorMessage}`, 'error');
      
      // Add detailed error information
      if (err.response) {
        addGlobalLog(`📊 Error details: Status ${err.response.status}, Data: ${JSON.stringify(err.response.data)}`, 'error');
      } else if (err.request) {
        addGlobalLog(`📡 Request error: No response received from server`, 'error');
        addGlobalLog(`🔧 Request details: ${err.request.responseURL || 'No URL'}`, 'error');
      } else {
        addGlobalLog(`⚙️ Setup error: ${err.message}`, 'error');
      }
      
      // Provide user-friendly error message
      let userFriendlyError = errorMessage;
      if (err.code === 'ERR_NETWORK') {
        userFriendlyError = 'Cannot connect to server. Please check your internet connection and try again.';
      } else if (err.code === 'ECONNABORTED') {
        userFriendlyError = 'Request timeout. The server is taking too long to respond.';
      }
      
      setError(userFriendlyError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    addGlobalLog('👋 Logging out...', 'info');
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