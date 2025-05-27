import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, useTheme, useMediaQuery, Container, Avatar, Menu, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAnalyzer } from '../context/AnalyzerContext';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { resetAll } = useAnalyzer();
  const { user, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to restart the entire process?')) {
      resetAll();
      navigate('/upload');
    }
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  return (
    <AppBar 
      position="static" 
      color="transparent" 
      elevation={0}
      sx={{ 
        boxShadow: 'none', 
        borderBottom: '1px solid #1E3A54',
        backgroundColor: theme.palette.background.default
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ px: { xs: 1, sm: 2 }, py: 2, display: 'flex', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              fontWeight: 600,
              color: '#7DE1C3',
              letterSpacing: '-0.02em',
              fontFamily: '"Inter", sans-serif',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          >
            Tech-Interview
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Navigation Buttons - Only show when authenticated */}
            {isAuthenticated && (
              <>
                <Button 
                  variant="text"
                  onClick={() => navigate('/history')}
                  sx={{ 
                    color: theme.palette.text.secondary,
                    mr: 1,
                    '&:hover': {
                      color: '#7DE1C3',
                      backgroundColor: 'rgba(125, 225, 195, 0.08)'
                    }
                  }}
                >
                  Historial
                </Button>
                <Button 
                  variant="text"
                  onClick={() => navigate('/diagnostic')}
                  sx={{ 
                    color: theme.palette.text.secondary,
                    mr: 1,
                    '&:hover': {
                      color: '#7DE1C3',
                      backgroundColor: 'rgba(125, 225, 195, 0.08)'
                    }
                  }}
                >
                  Diagnóstico
                </Button>
                <Button 
                  variant="text"
                  onClick={() => navigate('/logs')}
                  sx={{ 
                    color: theme.palette.text.secondary,
                    mr: 1,
                    '&:hover': {
                      color: '#7DE1C3',
                      backgroundColor: 'rgba(125, 225, 195, 0.08)'
                    }
                  }}
                >
                  Logs
                </Button>
                <Button 
                  variant="text"
                  onClick={handleReset}
                  sx={{ 
                    color: theme.palette.text.secondary,
                    mr: 2,
                    '&:hover': {
                      color: '#7DE1C3',
                      backgroundColor: 'rgba(125, 225, 195, 0.08)'
                    }
                  }}
                >
                  Reset
                </Button>
              </>
            )}
            
            {/* User Menu or Login Button */}
            {isAuthenticated ? (
              <>
                <Button
                  onClick={handleMenu}
                  sx={{ 
                    color: theme.palette.text.primary,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'rgba(125, 225, 195, 0.08)'
                    }
                  }}
                  startIcon={
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: '#7DE1C3',
                        color: '#0A1929',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}
                    >
                      {user?.name ? user.name.charAt(0) : 'U'}
                    </Avatar>
                  }
                >
                  {user?.name || 'User'}
                </Button>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  PaperProps={{
                    sx: {
                      backgroundColor: theme.palette.background.paper,
                      border: '1px solid #1E3A54',
                      borderRadius: 0,
                      mt: 1,
                      '& .MuiMenuItem-root': {
                        color: theme.palette.text.primary
                      }
                    }
                  }}
                >
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <Button 
                variant="contained"
                color="primary"
                onClick={() => navigate('/login')}
                sx={{
                  backgroundColor: '#7DE1C3',
                  color: '#0A1929',
                  '&:hover': { backgroundColor: '#55C4A5' }
                }}
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 