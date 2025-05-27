// API Configuration for separated frontend/backend architecture

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://tech-interview-backend.onrender.com'
    : 'http://localhost:10000'
  );

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    // Auth endpoints
    AUTH_GOOGLE: '/api/auth/google',
    AUTH_VERIFY: '/api/auth/verify',
    AUTH_REFRESH: '/api/auth/refresh',
    AUTH_LOGOUT: '/api/auth/logout',
    
    // Main API endpoints
    TRANSCRIPT: '/api/transcript',
    CASE_STUDIES: '/api/case-studies',
    EVALUATE: '/api/evaluate',
    EVALUATIONS: '/api/evaluations',
    EVALUATIONS_SAVE: '/api/evaluations/save',
    TRANSCRIPTS: '/api/transcripts',
    
    // Debug endpoints
    DEBUG_STATUS: '/api/debug/status',
    SERVER_INFO: '/api/server-info'
  }
};

// Helper function to build full URL
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Export for backward compatibility
export default API_CONFIG; 