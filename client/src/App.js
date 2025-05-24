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

// Creamos un tema personalizado inspirado en diseño minimalista de UGMONK
const theme = createTheme({
  palette: {
    primary: {
      main: '#000000',
      light: '#333333',
      dark: '#000000',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#5C5C5C',
      light: '#7F7F7F',
      dark: '#3A3A3A',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#EB5757',
      light: '#FF8A8A',
      dark: '#C53030',
    },
    warning: {
      main: '#F2994A',
      light: '#F2C94C',
      dark: '#E67E22',
    },
    info: {
      main: '#56CCF2',
      light: '#2D9CDB',
      dark: '#2B6CB0',
    },
    success: {
      main: '#6FCF97',
      light: '#27AE60',
      dark: '#219653',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#000000',
      secondary: '#4F4F4F',
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: {
      fontWeight: 400,
      fontSize: '3rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontWeight: 400,
      fontSize: '2.5rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 400,
      fontSize: '2rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 400,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 400,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
      letterSpacing: '-0.01em',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      letterSpacing: '-0.01em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '-0.01em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '-0.01em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 400,
      letterSpacing: '-0.01em',
    },
  },
  shape: {
    borderRadius: 0,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 1px 3px rgba(0, 0, 0, 0.1)',
    '0px 1px 4px rgba(0, 0, 0, 0.12)',
    '0px 1px 5px rgba(0, 0, 0, 0.14)',
    '0px 1px 6px rgba(0, 0, 0, 0.16)',
    '0px 1px 7px rgba(0, 0, 0, 0.18)',
    '0px 1px 8px rgba(0, 0, 0, 0.2)',
    '0px 1px 9px rgba(0, 0, 0, 0.22)',
    '0px 1px 10px rgba(0, 0, 0, 0.24)',
    '0px 1px 11px rgba(0, 0, 0, 0.26)',
    '0px 1px 12px rgba(0, 0, 0, 0.28)',
    '0px 1px 13px rgba(0, 0, 0, 0.3)',
    '0px 1px 14px rgba(0, 0, 0, 0.32)',
    '0px 1px 15px rgba(0, 0, 0, 0.34)',
    '0px 1px 16px rgba(0, 0, 0, 0.36)',
    '0px 1px 17px rgba(0, 0, 0, 0.38)',
    '0px 1px 18px rgba(0, 0, 0, 0.4)',
    '0px 1px 19px rgba(0, 0, 0, 0.42)',
    '0px 1px 20px rgba(0, 0, 0, 0.44)',
    '0px 1px 21px rgba(0, 0, 0, 0.46)',
    '0px 1px 22px rgba(0, 0, 0, 0.48)',
    '0px 1px 23px rgba(0, 0, 0, 0.5)',
    '0px 1px 24px rgba(0, 0, 0, 0.52)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: 'none',
          fontWeight: 400,
          padding: '8px 22px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          backgroundColor: '#000000',
          '&:hover': {
            backgroundColor: '#333333',
          },
        },
        outlinedPrimary: {
          borderColor: '#E0E0E0',
          color: '#000000',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            borderColor: '#000000',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 'none',
        },
        outlined: {
          borderColor: '#E0E0E0',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          overflow: 'hidden',
          borderRadius: 0,
          boxShadow: 'none',
          border: '1px solid #E0E0E0',
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
              borderColor: '#E0E0E0',
              borderRadius: 0,
            },
            '&:hover fieldset': {
              borderColor: '#000000',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#000000',
              borderWidth: 1,
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          borderBottom: '1px solid #E0E0E0',
        },
        head: {
          backgroundColor: '#F9F9F9',
          color: '#4F4F4F',
          fontWeight: 400,
          borderBottom: '1px solid #E0E0E0',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 0,
          backgroundColor: '#F2F2F2',
        },
        bar: {
          borderRadius: 0,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 30,
          fontSize: '0.875rem',
          fontWeight: 400,
          borderRadius: 2,
        },
        filled: {
          backgroundColor: '#F2F2F2',
          color: '#4F4F4F',
          '&.MuiChip-colorPrimary': {
            backgroundColor: '#F2F2F2',
            color: '#000000',
          },
          '&.MuiChip-colorSecondary': {
            backgroundColor: '#F2F2F2',
            color: '#4F4F4F',
          },
          '&.MuiChip-colorSuccess': {
            backgroundColor: '#F2F9F5',
            color: '#219653',
          },
          '&.MuiChip-colorError': {
            backgroundColor: '#FDEEEE',
            color: '#EB5757',
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: '#FEF6EC',
            color: '#F2994A',
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8, px: { xs: 2, md: 3 } }}>
        <Box sx={{ mb: 4 }}>
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