import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setGlobalLogHandler } from '../context/AuthContext';

const Login = () => {
  const { user, loading, error, login, api } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);
  const [showGoogleButton, setShowGoogleButton] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking', 'online', 'offline'

  const addLog = (message, type = 'info') => {
    console.log(`[${type.toUpperCase()}]`, message);
  };

  // Check backend status
  const checkBackendStatus = async () => {
    try {
      if (!api) {
        setBackendStatus('offline');
        return;
      }
      
      const response = await api.get('/health');
      if (response.status === 200) {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    } catch (error) {
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    // Set up global log handler to capture AuthContext logs
    setGlobalLogHandler(addLog);

    // If user is already logged in, redirect to home
    if (user) {
      navigate('/upload');
    }

    // Check backend status
    checkBackendStatus();

    // Cleanup function
    return () => {
      setGlobalLogHandler(null);
    };
  }, [user, navigate, api]);

  const handleGoogleLogin = async () => {
    addLog('🚀 Starting Google login process...', 'info');
    setLoginError(null);
    
    try {
      // Check if we have a real Google Client ID configured
      const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      addLog(`🔑 Google Client ID check: ${googleClientId ? 'Present' : 'Missing'}`, 'info');
      
      if (!googleClientId || googleClientId.includes('1234567890')) {
        // Fallback mode - use mock authentication for development/testing
        addLog('⚠️ Using fallback authentication mode', 'warning');
        const mockToken = "mock_google_token_" + Date.now();
        addLog(`🎭 Mock token generated: ${mockToken}`, 'info');
        
        try {
          await login(mockToken);
          addLog('✅ Mock login successful', 'success');
          navigate('/upload');
        } catch (mockErr) {
          addLog(`❌ Mock login failed: ${mockErr.message}`, 'error');
          setLoginError(`Mock login failed: ${mockErr.message}`);
        }
        return;
      }

      // Real Google OAuth mode
      addLog('🌐 Attempting real Google OAuth...', 'info');
      
      if (!window.google) {
        addLog('❌ Google Identity Services not loaded', 'error');
        setLoginError('Google Identity Services not loaded. Please refresh the page.');
        return;
      }

      addLog('✅ Google Identity Services loaded', 'success');

      // Initialize Google OAuth with real credentials
      addLog('🔧 Initializing Google OAuth...', 'info');
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          addLog('📞 Google OAuth callback received', 'info');
          try {
            addLog('🔐 Sending credential to backend...', 'info');
            // Send the credential to our backend
            await login(response.credential);
            addLog('✅ Backend authentication successful', 'success');
            navigate('/upload');
          } catch (err) {
            addLog(`❌ Backend authentication failed: ${err.message}`, 'error');
            const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
            setLoginError(`Authentication failed: ${errorMsg}`);
          }
        },
        error_callback: (error) => {
          addLog(`❌ Google OAuth error callback: ${error.type || 'Unknown error'}`, 'error');
          setLoginError(`Google OAuth error: ${error.type || 'Unknown error'}`);
        }
      });

      // Try popup first, then fallback to button
      addLog('🎯 Attempting popup login...', 'info');
      window.google.accounts.id.prompt((notification) => {
        addLog(`📋 Google prompt notification: ${JSON.stringify(notification)}`, 'info');
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          addLog('⚠️ Popup blocked or skipped, rendering alternative button...', 'warning');
          
          // Automatically render the Google button as fallback
          setTimeout(() => {
            renderGoogleButton();
            setLoginError('Popup was blocked. Please use the Google Sign-In button below.');
          }, 500);
        }
      });
    } catch (err) {
      addLog(`❌ Google login initialization failed: ${err.message}`, 'error');
      setLoginError(`Failed to initialize Google login: ${err.message}`);
    }
  };

  const renderGoogleButton = () => {
    addLog('🔘 Rendering Google Sign-In button...', 'info');
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    
    if (!googleClientId || !window.google) {
      addLog('❌ Cannot render Google button: missing configuration', 'error');
      return;
    }

    try {
      // Initialize Google OAuth if not already done
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          addLog('📞 Google button callback received', 'info');
          try {
            addLog('🔐 Sending credential to backend...', 'info');
            await login(response.credential);
            addLog('✅ Backend authentication successful', 'success');
            navigate('/upload');
          } catch (err) {
            addLog(`❌ Backend authentication failed: ${err.message}`, 'error');
            const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
            setLoginError(`Authentication failed: ${errorMsg}`);
          }
        }
      });

      // Render the button
      const buttonContainer = document.getElementById('google-signin-button');
      if (buttonContainer) {
        buttonContainer.innerHTML = ''; // Clear any existing content
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 280
        });
        addLog('✅ Google button rendered successfully', 'success');
        setShowGoogleButton(true);
      }
    } catch (err) {
      addLog(`❌ Failed to render Google button: ${err.message}`, 'error');
    }
  };

  const getStatusColor = () => {
    switch (backendStatus) {
      case 'online': return '#4caf50'; // Green
      case 'offline': return '#f44336'; // Red
      case 'checking': return '#ff9800'; // Orange
      default: return '#9e9e9e'; // Gray
    }
  };

  const getStatusText = () => {
    switch (backendStatus) {
      case 'online': return 'Backend Online';
      case 'offline': return 'Backend Offline';
      case 'checking': return 'Checking...';
      default: return 'Unknown';
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
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          py: 2
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
            mb: 2
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

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, gap: 2 }}>
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
            
            {/* Alternative Google Button */}
            {showGoogleButton && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Or use the official Google Sign-In button:
                </Typography>
                <Box 
                  id="google-signin-button" 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    minHeight: '40px',
                    alignItems: 'center'
                  }}
                />
              </Box>
            )}
            
            {/* Manual Button Render Option */}
            {!showGoogleButton && (
              <Button
                variant="outlined"
                size="small"
                onClick={renderGoogleButton}
                sx={{
                  color: '#7DE1C3',
                  borderColor: '#7DE1C3',
                  '&:hover': { borderColor: '#55C4A5', backgroundColor: 'rgba(125, 225, 195, 0.1)' },
                }}
              >
                Show Google Sign-In Button
              </Button>
            )}
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

        {/* Simple Backend Status Indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: getStatusColor(),
              mr: 1,
              animation: backendStatus === 'checking' ? 'pulse 1.5s ease-in-out infinite' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.5 },
                '100%': { opacity: 1 }
              }
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            {getStatusText()}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Login; 