import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Container } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Log the current route and authentication status for debugging
    console.log(`🛡️ ProtectedRoute check: ${location.pathname}`, {
      isAuthenticated,
      loading,
      hasUser: !!user
    });

    // If not loading and not authenticated, log the redirect
    if (!loading && !isAuthenticated) {
      console.log(`🔄 Redirecting from protected route ${location.pathname} to /login`);
    }
  }, [isAuthenticated, loading, location.pathname, user]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '80vh',
            gap: 2
          }}
        >
          <CircularProgress />
          <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
            Verifying authentication...
          </Box>
        </Box>
      </Container>
    );
  }

  // If authenticated, render the protected content
  if (isAuthenticated) {
    return <Outlet />;
  }

  // If not authenticated, redirect to login with the current location
  // This allows redirecting back after successful login
  return (
    <Navigate 
      to="/login" 
      state={{ from: location.pathname }} 
      replace 
    />
  );
};

export default ProtectedRoute; 