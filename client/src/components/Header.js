import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAnalyzer } from '../context/AnalyzerContext';

const Header = () => {
  const navigate = useNavigate();
  const { resetAll } = useAnalyzer();

  const handleReset = () => {
    if (window.confirm('¿Estás seguro de que quieres reiniciar todo el proceso?')) {
      resetAll();
      navigate('/upload');
    }
  };

  return (
    <AppBar position="static" color="primary" elevation={0}>
      <Toolbar>
        <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          🧩 Tech Architecture Interview Analyzer
        </Typography>
        <Box>
          <Button 
            color="inherit" 
            onClick={handleReset}
            sx={{ fontWeight: 500 }}
          >
            Reiniciar
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 