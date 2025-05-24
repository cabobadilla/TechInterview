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

// Creamos un tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#3b82f6',
    },
    secondary: {
      main: '#10b981',
    },
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 20px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
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