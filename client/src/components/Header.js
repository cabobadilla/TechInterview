import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, useTheme, useMediaQuery, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAnalyzer } from '../context/AnalyzerContext';
import AssessmentIcon from '@mui/icons-material/Assessment';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      color="primary" 
      elevation={0}
      sx={{ 
        boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3)', 
        background: 'linear-gradient(90deg, #4285F4 0%, #5A9BFF 100%)'
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ px: { xs: 1, sm: 2 }, py: 1.5 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              flexGrow: 1,
              gap: 1.5
            }}
          >
            <AssessmentIcon 
              sx={{ 
                fontSize: isMobile ? 28 : 32,
                color: '#FFFFFF'
              }} 
            />
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              component="div" 
              sx={{ 
                fontWeight: 500,
                color: '#FFFFFF',
                letterSpacing: '-0.01em'
              }}
            >
              Tech Architecture Interview Analyzer
            </Typography>
          </Box>
          <Box>
            <Button 
              variant="outlined"
              onClick={handleReset}
              sx={{ 
                fontWeight: 500,
                color: '#FFFFFF',
                borderColor: 'rgba(255, 255, 255, 0.5)',
                '&:hover': {
                  borderColor: '#FFFFFF',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)'
                },
                px: isMobile ? 2 : 3
              }}
            >
              {isMobile ? 'Reiniciar' : 'Reiniciar proceso'}
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 