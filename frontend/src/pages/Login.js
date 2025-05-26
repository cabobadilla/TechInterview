import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { user, loading, error, login } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (user) {
      navigate('/upload');
    }

    // Debug information
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const apiUrl = process.env.REACT_APP_API_URL;
    const nodeEnv = process.env.NODE_ENV;
    
    const debugData = {
      googleClientId: googleClientId ? `${googleClientId.substring(0, 20)}...` : 'NOT SET',
      apiUrl: apiUrl || 'NOT SET',
      nodeEnv: nodeEnv || 'NOT SET',
      googleLoaded: !!window.google,
      timestamp: new Date().toISOString()
    };
    
    console.log('🔍 Login Debug Info:', debugData);
    setDebugInfo(JSON.stringify(debugData, null, 2));
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    console.log('🚀 Starting Google login process...');
    setLoginError(null);
    
    try {
      // Check if we have a real Google Client ID configured
      const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      console.log('🔑 Google Client ID check:', googleClientId ? 'Present' : 'Missing');
      
      if (!googleClientId || googleClientId.includes('1234567890')) {
        // Fallback mode - use mock authentication for development/testing
        console.log('⚠️ Using fallback authentication mode');
        const mockToken = "mock_google_token_" + Date.now();
        console.log('🎭 Mock token generated:', mockToken);
        
        try {
          await login(mockToken);
          console.log('✅ Mock login successful');
          navigate('/upload');
        } catch (mockErr) {
          console.error('❌ Mock login failed:', mockErr);
          setLoginError(`Mock login failed: ${mockErr.message}`);
        }
        return;
      }

      // Real Google OAuth mode
      console.log('🌐 Attempting real Google OAuth...');
      
      if (!window.google) {
        console.error('❌ Google Identity Services not loaded');
        setLoginError('Google Identity Services not loaded. Please refresh the page.');
        return;
      }

      console.log('✅ Google Identity Services loaded');

      // Initialize Google OAuth with real credentials
      console.log('🔧 Initializing Google OAuth...');
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          console.log('📞 Google OAuth callback received');
          try {
            console.log('🔐 Sending credential to backend...');
            // Send the credential to our backend
            await login(response.credential);
            console.log('✅ Backend authentication successful');
            navigate('/upload');
          } catch (err) {
            console.error('❌ Backend authentication failed:', err);
            const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
            setLoginError(`Authentication failed: ${errorMsg}`);
          }
        },
        error_callback: (error) => {
          console.error('❌ Google OAuth error callback:', error);
          setLoginError(`Google OAuth error: ${error.type || 'Unknown error'}`);
        }
      });

      console.log('🎯 Prompting for Google login...');
      // Prompt for login
      window.google.accounts.id.prompt((notification) => {
        console.log('📋 Google prompt notification:', notification);
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('⚠️ Google prompt was not displayed or skipped');
          setLoginError('Google login prompt was not displayed. Please try clicking the button again.');
        }
      });
    } catch (err) {
      console.error('❌ Google login initialization failed:', err);
      setLoginError(`Failed to initialize Google login: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            p: 4,
            borderRadius: 0,
            backgroundColor: 'background.paper',
            border: '1px solid #1E3A54',
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            align="center"
            gutterBottom
            sx={{ mb: 2, color: '#7DE1C3' }}
          >
            Welcome to TECHANALYZER
          </Typography>
          
          <Typography
            variant="body1"
            align="center"
            sx={{ mb: 4, color: 'text.secondary' }}
          >
            Sign in to access the interview analysis tool
          </Typography>

          {(error || loginError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || loginError}
            </Alert>
          )}

          {process.env.NODE_ENV === 'development' && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="caption" component="pre" sx={{ fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                Debug Info: {debugInfo}
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleGoogleLogin}
              sx={{
                py: 1.5,
                px: 4,
                backgroundColor: '#7DE1C3',
                color: '#0A1929',
                '&:hover': { backgroundColor: '#55C4A5' },
              }}
            >
              Sign in with Google
            </Button>
          </Box>
          
          <Divider sx={{ my: 4, borderColor: '#1E3A54' }} />
          
          <Typography
            variant="caption"
            align="center"
            sx={{ display: 'block', color: 'text.secondary' }}
          >
            This application requires authentication to protect interview data.
            {process.env.NODE_ENV === 'production' 
              ? ' All data is securely stored on Render.com.' 
              : ' You are using a development environment.'}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 