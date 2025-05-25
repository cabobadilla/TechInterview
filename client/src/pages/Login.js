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

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (user) {
      navigate('/upload');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setLoginError(null);
    // This would be replaced with actual Google OAuth implementation
    // For now, we'll simulate a successful login
    try {
      const mockGoogleToken = "mock_google_token";
      await login(mockGoogleToken);
      navigate('/upload');
    } catch (err) {
      console.error('Login failed:', err);
      setLoginError('Failed to authenticate with Google. Please try again.');
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