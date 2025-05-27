import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, Box, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useAnalyzer } from './context/AnalyzerContext';
import { LogsProvider } from './context/LogsContext';

// Componentes
import Header from './components/Header';
import Stepper from './components/Stepper';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import TranscriptUpload from './pages/TranscriptUpload';
import CaseSelection from './pages/CaseSelection';
import Results from './pages/Results';
import Login from './pages/Login';
import EvaluationHistory from './pages/EvaluationHistory';
import EvaluationDetails from './pages/EvaluationDetails';
import EvaluationDetailsTest from './pages/EvaluationDetailsTest';
import ServerDiagnostic from './pages/ServerDiagnostic';
import Logs from './pages/Logs';

// Creamos un tema personalizado inspirado en el diseño minimalista con acentos verde agua
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7DE1C3', // Mint/teal green
      light: '#A3F0D8',
      dark: '#55C4A5',
      contrastText: '#0A1929',
    },
    secondary: {
      main: '#7DE1C3', // Same teal for secondary
      light: '#A3F0D8',
      dark: '#55C4A5',
      contrastText: '#0A1929',
    },
    error: {
      main: '#FF6B6B',
      light: '#FF9F9F',
      dark: '#D14343',
    },
    warning: {
      main: '#FFD166',
      light: '#FFDF94',
      dark: '#DBA832',
    },
    info: {
      main: '#73C8F0',
      light: '#A3E0FF',
      dark: '#4D99BF',
    },
    success: {
      main: '#7DE1C3',
      light: '#A3F0D8',
      dark: '#55C4A5',
    },
    background: {
      default: '#0A1929', // Dark navy/black background
      paper: '#122C44', // Slightly lighter navy for cards
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#E0E7EF',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: {
      fontWeight: 400,
      fontSize: '3rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
      color: '#7DE1C3',
    },
    h2: {
      fontWeight: 400,
      fontSize: '2.5rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      color: '#7DE1C3',
    },
    h3: {
      fontWeight: 400,
      fontSize: '2rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      color: '#7DE1C3',
    },
    h4: {
      fontWeight: 400,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
      color: '#7DE1C3',
    },
    h5: {
      fontWeight: 400,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
      color: '#7DE1C3',
    },
    h6: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '-0.01em',
      color: '#7DE1C3',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
      letterSpacing: '-0.01em',
      color: '#FFFFFF',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      letterSpacing: '-0.01em',
      color: '#FFFFFF',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '-0.01em',
      color: '#FFFFFF',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '-0.01em',
      color: '#FFFFFF',
    },
    button: {
      textTransform: 'none',
      fontWeight: 400,
      letterSpacing: '-0.01em',
    },
    caption: {
      color: '#E0E7EF',
      fontSize: '0.75rem',
    },
    overline: {
      color: '#E0E7EF',
    },
  },
  shape: {
    borderRadius: 0,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.25)',
    '0px 1px 3px rgba(0, 0, 0, 0.3)',
    '0px 1px 4px rgba(0, 0, 0, 0.35)',
    '0px 1px 5px rgba(0, 0, 0, 0.4)',
    '0px 1px 6px rgba(0, 0, 0, 0.45)',
    '0px 1px 7px rgba(0, 0, 0, 0.5)',
    '0px 1px 8px rgba(0, 0, 0, 0.55)',
    '0px 1px 9px rgba(0, 0, 0, 0.6)',
    '0px 1px 10px rgba(0, 0, 0, 0.65)',
    '0px 1px 11px rgba(0, 0, 0, 0.7)',
    '0px 1px 12px rgba(0, 0, 0, 0.75)',
    '0px 1px 13px rgba(0, 0, 0, 0.8)',
    '0px 1px 14px rgba(0, 0, 0, 0.85)',
    '0px 1px 15px rgba(0, 0, 0, 0.9)',
    '0px 1px 16px rgba(0, 0, 0, 0.95)',
    '0px 1px 17px rgba(0, 0, 0, 1)',
    '0px 1px 18px rgba(0, 0, 0, 1)',
    '0px 1px 19px rgba(0, 0, 0, 1)',
    '0px 1px 20px rgba(0, 0, 0, 1)',
    '0px 1px 21px rgba(0, 0, 0, 1)',
    '0px 1px 22px rgba(0, 0, 0, 1)',
    '0px 1px 23px rgba(0, 0, 0, 1)',
    '0px 1px 24px rgba(0, 0, 0, 1)',
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
          backgroundColor: '#7DE1C3',
          color: '#0A1929',
          '&:hover': {
            backgroundColor: '#55C4A5',
          },
        },
        outlinedPrimary: {
          borderColor: '#7DE1C3',
          color: '#7DE1C3',
          '&:hover': {
            backgroundColor: 'rgba(125, 225, 195, 0.08)',
            borderColor: '#A3F0D8',
          },
        },
        text: {
          color: '#7DE1C3',
          '&:hover': {
            backgroundColor: 'rgba(125, 225, 195, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 'none',
          backgroundColor: '#122C44',
        },
        outlined: {
          borderColor: '#1E3A54',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          overflow: 'hidden',
          borderRadius: 0,
          boxShadow: 'none',
          border: '1px solid #1E3A54',
          backgroundColor: '#122C44',
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
              borderColor: '#1E3A54',
              borderRadius: 0,
            },
            '&:hover fieldset': {
              borderColor: '#7DE1C3',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#7DE1C3',
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
          borderBottom: '1px solid #1E3A54',
        },
        head: {
          backgroundColor: '#0E2337',
          color: '#FFFFFF',
          fontWeight: 400,
          borderBottom: '1px solid #1E3A54',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 4,
          borderRadius: 0,
          backgroundColor: '#1E3A54',
        },
        bar: {
          borderRadius: 0,
          backgroundColor: '#7DE1C3',
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
          backgroundColor: '#1E3A54',
          color: '#FFFFFF',
          '&.MuiChip-colorPrimary': {
            backgroundColor: 'rgba(125, 225, 195, 0.15)',
            color: '#7DE1C3',
          },
          '&.MuiChip-colorSecondary': {
            backgroundColor: 'rgba(125, 225, 195, 0.15)',
            color: '#7DE1C3',
          },
          '&.MuiChip-colorSuccess': {
            backgroundColor: 'rgba(125, 225, 195, 0.15)',
            color: '#7DE1C3',
          },
          '&.MuiChip-colorError': {
            backgroundColor: 'rgba(255, 107, 107, 0.15)',
            color: '#FF6B6B',
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: 'rgba(255, 209, 102, 0.15)',
            color: '#FFD166',
          },
        },
        outlined: {
          borderColor: '#1E3A54',
          color: '#FFFFFF',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
        standardError: {
          backgroundColor: 'transparent',
          color: '#FF6B6B',
          border: '1px solid #FF6B6B',
          '& .MuiAlert-icon': { color: '#FF6B6B' },
        },
        standardWarning: {
          backgroundColor: 'transparent',
          color: '#FFD166',
          border: '1px solid #FFD166',
          '& .MuiAlert-icon': { color: '#FFD166' },
        },
        standardInfo: {
          backgroundColor: 'transparent',
          color: '#73C8F0',
          border: '1px solid #73C8F0',
          '& .MuiAlert-icon': { color: '#73C8F0' },
        },
        standardSuccess: {
          backgroundColor: 'transparent',
          color: '#7DE1C3',
          border: '1px solid #7DE1C3',
          '& .MuiAlert-icon': { color: '#7DE1C3' },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#1E3A54',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        secondary: {
          color: '#E0E7EF',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(125, 225, 195, 0.15)',
          },
          '&.Mui-selected:hover': {
            backgroundColor: 'rgba(125, 225, 195, 0.25)',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          color: '#FFFFFF',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: '#7DE1C3',
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: '#E0E7EF',
        },
      },
    },
  },
});

function App() {
  const { step, qa_pairs, evaluationResults, transcript, selectedCase, setSelectedCase } = useAnalyzer();

  return (
    <LogsProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
          <Header />
          <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
            <Routes>
              {/* Ruta pública para login */}
              <Route path="/login" element={<Login />} />

              {/* Rutas protegidas */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Navigate to="/upload" replace />} />
                <Route path="/upload" element={
                  <>
                    <Stepper activeStep={step} />
                    <TranscriptUpload />
                  </>
                } />
                <Route path="/select-case" element={
                  <>
                    <Stepper activeStep={step} />
                    <CaseSelection selectedCase={selectedCase} setSelectedCase={setSelectedCase} />
                  </>
                } />
                <Route path="/results" element={
                  <>
                    <Stepper activeStep={step} />
                    <Results qa_pairs={qa_pairs} evaluationResults={evaluationResults} transcript={transcript} />
                  </>
                } />
                <Route path="/history" element={<EvaluationHistory />} />
                <Route path="/evaluation/:id" element={<EvaluationDetails />} />
                <Route path="/diagnostic" element={<ServerDiagnostic />} />
                <Route path="/logs" element={<Logs />} />
              </Route>
            </Routes>
          </Container>
        </Box>
      </ThemeProvider>
    </LogsProvider>
  );
}

export default App; 