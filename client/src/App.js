import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, Box, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useAnalyzer } from './context/AnalyzerContext';

// Componentes
import Header from './components/Header';
import Stepper from './components/Stepper';

// Páginas
import TranscriptUpload from './pages/TranscriptUpload';
import CaseSelection from './pages/CaseSelection';
import Results from './pages/Results';

// Creamos un tema personalizado inspirado en diseños profesionales modernos
const theme = createTheme({
  palette: {
    primary: {
      main: '#4285F4', // Google Blue
      light: '#80B4FF',
      dark: '#2A75F3',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#34A853', // Google Green
      light: '#66BB6A',
      dark: '#1E8E3E',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#EA4335', // Google Red
      light: '#FF6659',
      dark: '#C62828',
    },
    warning: {
      main: '#FBBC05', // Google Yellow
      light: '#FDD835',
      dark: '#F57F17',
    },
    info: {
      main: '#4285F4',
      light: '#64B5F6',
      dark: '#1976D2',
    },
    success: {
      main: '#34A853',
      light: '#66BB6A',
      dark: '#2E7D32',
    },
    background: {
      default: '#F8F9FA', // Light gray background
      paper: '#FFFFFF',
    },
    text: {
      primary: '#202124', // Google dark gray for text
      secondary: '#5F6368', // Google medium gray for secondary text
    },
  },
  typography: {
    fontFamily: '"Google Sans", "Roboto", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 500,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.1rem',
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.05), 0px 1px 1px 0px rgba(0,0,0,0.03), 0px 1px 3px 0px rgba(0,0,0,0.1)',
    '0px 3px 1px -2px rgba(0,0,0,0.05), 0px 2px 2px 0px rgba(0,0,0,0.03), 0px 1px 5px 0px rgba(0,0,0,0.1)',
    '0px 3px 3px -2px rgba(0,0,0,0.05), 0px 3px 4px 0px rgba(0,0,0,0.03), 0px 1px 8px 0px rgba(0,0,0,0.1)',
    '0px 2px 4px -1px rgba(0,0,0,0.05), 0px 4px 5px 0px rgba(0,0,0,0.03), 0px 1px 10px 0px rgba(0,0,0,0.1)',
    '0px 3px 5px -1px rgba(0,0,0,0.05), 0px 5px 8px 0px rgba(0,0,0,0.03), 0px 1px 14px 0px rgba(0,0,0,0.1)',
    '0px 3px 5px -1px rgba(0,0,0,0.05), 0px 6px 10px 0px rgba(0,0,0,0.03), 0px 1px 18px 0px rgba(0,0,0,0.1)',
    '0px 4px 5px -2px rgba(0,0,0,0.05), 0px 7px 10px 1px rgba(0,0,0,0.03), 0px 2px 16px 1px rgba(0,0,0,0.1)',
    '0px 5px 5px -3px rgba(0,0,0,0.05), 0px 8px 10px 1px rgba(0,0,0,0.03), 0px 3px 14px 2px rgba(0,0,0,0.1)',
    '0px 5px 6px -3px rgba(0,0,0,0.05), 0px 9px 12px 1px rgba(0,0,0,0.03), 0px 3px 16px 2px rgba(0,0,0,0.1)',
    '0px 6px 6px -3px rgba(0,0,0,0.05), 0px 10px 14px 1px rgba(0,0,0,0.03), 0px 4px 18px 3px rgba(0,0,0,0.1)',
    '0px 6px 7px -4px rgba(0,0,0,0.05), 0px 11px 15px 1px rgba(0,0,0,0.03), 0px 4px 20px 3px rgba(0,0,0,0.1)',
    '0px 7px 8px -4px rgba(0,0,0,0.05), 0px 12px 17px 2px rgba(0,0,0,0.03), 0px 5px 22px 4px rgba(0,0,0,0.1)',
    '0px 7px 8px -4px rgba(0,0,0,0.05), 0px 13px 19px 2px rgba(0,0,0,0.03), 0px 5px 24px 4px rgba(0,0,0,0.1)',
    '0px 7px 9px -4px rgba(0,0,0,0.05), 0px 14px 21px 2px rgba(0,0,0,0.03), 0px 5px 26px 4px rgba(0,0,0,0.1)',
    '0px 8px 9px -5px rgba(0,0,0,0.05), 0px 15px 22px 2px rgba(0,0,0,0.03), 0px 6px 28px 5px rgba(0,0,0,0.1)',
    '0px 8px 10px -5px rgba(0,0,0,0.05), 0px 16px 24px 2px rgba(0,0,0,0.03), 0px 6px 30px 5px rgba(0,0,0,0.1)',
    '0px 8px 11px -5px rgba(0,0,0,0.05), 0px 17px 26px 2px rgba(0,0,0,0.03), 0px 6px 32px 5px rgba(0,0,0,0.1)',
    '0px 9px 11px -5px rgba(0,0,0,0.05), 0px 18px 28px 2px rgba(0,0,0,0.03), 0px 7px 34px 6px rgba(0,0,0,0.1)',
    '0px 9px 12px -6px rgba(0,0,0,0.05), 0px 19px 29px 2px rgba(0,0,0,0.03), 0px 7px 36px 6px rgba(0,0,0,0.1)',
    '0px 10px 13px -6px rgba(0,0,0,0.05), 0px 20px 31px 3px rgba(0,0,0,0.03), 0px 8px 38px 7px rgba(0,0,0,0.1)',
    '0px 10px 13px -6px rgba(0,0,0,0.05), 0px 21px 33px 3px rgba(0,0,0,0.03), 0px 8px 40px 7px rgba(0,0,0,0.1)',
    '0px 10px 14px -6px rgba(0,0,0,0.05), 0px 22px 35px 3px rgba(0,0,0,0.03), 0px 8px 42px 7px rgba(0,0,0,0.1)',
    '0px 11px 14px -7px rgba(0,0,0,0.05), 0px 23px 36px 3px rgba(0,0,0,0.03), 0px 9px 44px 8px rgba(0,0,0,0.1)',
    '0px 11px 15px -7px rgba(0,0,0,0.05), 0px 24px 38px 3px rgba(0,0,0,0.03), 0px 9px 46px 8px rgba(0,0,0,0.1)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 22px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#3367d6',
          },
        },
        outlinedPrimary: {
          borderColor: '#4285F4',
          '&:hover': {
            backgroundColor: 'rgba(66, 133, 244, 0.04)',
            borderColor: '#4285F4',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        },
        outlined: {
          borderColor: '#E8EAED',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          overflow: 'hidden',
          borderRadius: 8,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#DFE1E5',
            },
            '&:hover fieldset': {
              borderColor: '#AECBFA',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4285F4',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          borderBottom: '1px solid #E8EAED',
        },
        head: {
          backgroundColor: '#F8F9FA',
          color: '#5F6368',
          fontWeight: 500,
          borderBottom: '1px solid #E8EAED',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 4,
          backgroundColor: '#E8EAED',
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 32,
          fontSize: '0.875rem',
          fontWeight: 500,
        },
        filled: {
          backgroundColor: '#E8F0FE',
          color: '#174EA6',
          '&.MuiChip-colorPrimary': {
            backgroundColor: '#E8F0FE',
            color: '#174EA6',
          },
          '&.MuiChip-colorSecondary': {
            backgroundColor: '#E6F4EA',
            color: '#137333',
          },
          '&.MuiChip-colorSuccess': {
            backgroundColor: '#E6F4EA',
            color: '#137333',
          },
          '&.MuiChip-colorError': {
            backgroundColor: '#FCE8E6',
            color: '#C5221F',
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: '#FEF7E0',
            color: '#B06000',
          },
        },
      },
    },
  },
});

function App() {
  const { currentStep } = useAnalyzer();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      <Container maxWidth="lg" sx={{ mt: 3, mb: 8, px: { xs: 2, md: 3 } }}>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={currentStep} />
        </Box>
        
        <Routes>
          <Route path="/" element={<Navigate to="/upload" />} />
          <Route path="/upload" element={<TranscriptUpload />} />
          <Route path="/case-selection" element={<CaseSelection />} />
          <Route path="/results" element={<Results />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Container>
    </ThemeProvider>
  );
}

export default App; 