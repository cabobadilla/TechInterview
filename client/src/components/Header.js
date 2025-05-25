import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, useTheme, useMediaQuery, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAnalyzer } from '../context/AnalyzerContext';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { resetAll } = useAnalyzer();

  const handleReset = () => {
    if (window.confirm('¿Estás seguro de que quieres reiniciar todo el proceso?')) {
      resetAll();
      navigate('/upload');
    }
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
              fontFamily: '"Inter", sans-serif'
            }}
          >
            TECHANALYZER
          </Typography>
          
          {/* Reset Button */}
          <Button 
            variant="text"
            onClick={handleReset}
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': {
                color: '#7DE1C3',
                backgroundColor: 'rgba(125, 225, 195, 0.08)'
              }
            }}
          >
            Reset
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 