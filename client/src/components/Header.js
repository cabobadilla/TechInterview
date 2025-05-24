import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, useTheme, useMediaQuery, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAnalyzer } from '../context/AnalyzerContext';
import AddIcon from '@mui/icons-material/Add';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import SearchIcon from '@mui/icons-material/Search';

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
        borderBottom: '1px solid #E0E0E0',
        backgroundColor: '#FFFFFF'
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
              color: '#000000',
              letterSpacing: '-0.02em',
              fontFamily: '"Inter", sans-serif'
            }}
          >
            TECHANALYZER
          </Typography>
          
          {/* Navigation Links */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mx: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body1" sx={{ color: '#000', fontWeight: 400 }}>
                  Analog
                </Typography>
                <AddIcon fontSize="small" />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body1" sx={{ color: '#000', fontWeight: 400 }}>
                  Gather
                </Typography>
                <AddIcon fontSize="small" />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body1" sx={{ color: '#000', fontWeight: 400 }}>
                  Objects
                </Typography>
                <AddIcon fontSize="small" />
              </Box>
              <Typography variant="body1" sx={{ color: '#000', fontWeight: 400 }}>
                Best Sellers
              </Typography>
            </Box>
          )}
          
          {/* Right Side Icons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {!isMobile && (
              <Button 
                variant="outlined"
                sx={{ 
                  borderColor: '#E0E0E0',
                  color: '#000000',
                  borderRadius: 20,
                  px: 2,
                  py: 0.5,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#000000',
                    backgroundColor: 'transparent'
                  }
                }}
                onClick={handleReset}
              >
                Shop Analog
              </Button>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SearchIcon sx={{ color: '#000000' }} />
              <PersonOutlineIcon sx={{ color: '#000000' }} />
              <ShoppingBagOutlinedIcon sx={{ color: '#000000' }} />
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 