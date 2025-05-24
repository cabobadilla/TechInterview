import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Paper, Typography, Button, Box, Alert, 
  FormControl, InputLabel, Select, MenuItem, 
  Grid, Card, CardContent, Divider, Chip,
  useTheme, useMediaQuery
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import SchoolIcon from '@mui/icons-material/School';
import { useAnalyzer } from '../context/AnalyzerContext';
import axios from 'axios';

const CaseSelection = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { 
    qaPairs, 
    setSelectedCase, 
    selectedCase,
    setSelectedLevel,
    selectedLevel,
    nextStep, 
    prevStep,
    loading, 
    error, 
    setError 
  } = useAnalyzer();
  
  const [cases, setCases] = useState({});
  
  // Redireccionar si no hay QA pairs
  useEffect(() => {
    if (!qaPairs || qaPairs.length === 0) {
      navigate('/upload');
    }
    
    // Cargar casos de estudio
    const fetchCases = async () => {
      try {
        const response = await axios.get('/api/cases');
        setCases(response.data);
      } catch (err) {
        setError('Error al cargar los casos de estudio');
      }
    };
    
    fetchCases();
  }, [qaPairs, navigate, setError]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCase) {
      setError('Por favor selecciona un caso de estudio');
      return;
    }
    
    if (!selectedLevel) {
      setError('Por favor selecciona un nivel de experiencia');
      return;
    }
    
    nextStep();
    navigate('/results');
  };
  
  const getLevelColor = (level) => {
    switch(level) {
      case 'L1': return theme.palette.error.main;
      case 'L2': return theme.palette.warning.main;
      case 'L3': return theme.palette.primary.main;
      case 'L4': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };
  
  return (
    <Paper elevation={0} sx={{ 
      p: { xs: 2.5, md: 4 }, 
      borderRadius: 2, 
      border: '1px solid #E8EAED' 
    }}>
      <Typography variant="h4" gutterBottom fontWeight={500} color="text.primary">
        Paso 2: Selecciona el caso de estudio y nivel
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
        Selecciona el caso de estudio que se discutió en la entrevista y el nivel esperado del candidato.
      </Typography>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
        >
          {error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BookmarkIcon fontSize="small" color="primary" />
              <Typography variant="subtitle1" fontWeight={500}>
                Caso de Estudio
              </Typography>
            </Box>
            <FormControl fullWidth>
              <InputLabel>Caso de Estudio</InputLabel>
              <Select
                value={selectedCase || ''}
                onChange={(e) => setSelectedCase(e.target.value)}
                label="Caso de Estudio"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#DFE1E5',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#AECBFA',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#4285F4',
                  }
                }}
              >
                {Object.keys(cases).map((caseKey) => (
                  <MenuItem key={caseKey} value={caseKey}>
                    {cases[caseKey].name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon fontSize="small" color="primary" />
              <Typography variant="subtitle1" fontWeight={500}>
                Nivel Esperado
              </Typography>
            </Box>
            <FormControl fullWidth>
              <InputLabel>Nivel Esperado</InputLabel>
              <Select
                value={selectedLevel || ''}
                onChange={(e) => setSelectedLevel(e.target.value)}
                label="Nivel Esperado"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#DFE1E5',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#AECBFA',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#4285F4',
                  }
                }}
              >
                <MenuItem value="L1">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    L1
                    <Chip 
                      label="Junior" 
                      size="small" 
                      sx={{ 
                        backgroundColor: 'rgba(234, 67, 53, 0.1)', 
                        color: theme.palette.error.main,
                        fontWeight: 500
                      }} 
                    />
                  </Box>
                </MenuItem>
                <MenuItem value="L2">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    L2
                    <Chip 
                      label="Intermedio" 
                      size="small" 
                      sx={{ 
                        backgroundColor: 'rgba(251, 188, 5, 0.1)', 
                        color: theme.palette.warning.main,
                        fontWeight: 500
                      }} 
                    />
                  </Box>
                </MenuItem>
                <MenuItem value="L3">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    L3
                    <Chip 
                      label="Senior" 
                      size="small" 
                      sx={{ 
                        backgroundColor: 'rgba(66, 133, 244, 0.1)', 
                        color: theme.palette.primary.main,
                        fontWeight: 500
                      }} 
                    />
                  </Box>
                </MenuItem>
                <MenuItem value="L4">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    L4
                    <Chip 
                      label="Experto" 
                      size="small" 
                      sx={{ 
                        backgroundColor: 'rgba(52, 168, 83, 0.1)', 
                        color: theme.palette.success.main,
                        fontWeight: 500
                      }} 
                    />
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {selectedCase && cases[selectedCase] && (
          <Card 
            variant="outlined" 
            sx={{ 
              mt: 4, 
              mb: 4, 
              borderColor: '#E8EAED',
              borderRadius: 2,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                mb: 2 
              }}>
                <BookmarkIcon color="primary" />
                <Typography variant="h6" fontWeight={500}>
                  {cases[selectedCase].name}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 3 }}>
                <strong>Objetivo:</strong> {cases[selectedCase].objective}
              </Typography>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle2" fontWeight={500} gutterBottom sx={{ mb: 1.5, color: 'text.primary' }}>
                Proceso Esperado:
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {cases[selectedCase].process_answer.map((process, idx) => (
                  <Chip 
                    key={idx}
                    label={process}
                    color="primary"
                    variant="outlined"
                    size="medium"
                    sx={{ fontWeight: 500 }}
                  />
                ))}
              </Box>
              
              <Typography variant="subtitle2" fontWeight={500} gutterBottom sx={{ mb: 1.5, color: 'text.primary' }}>
                Consideraciones Clave:
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {cases[selectedCase].key_considerations_answer.map((consideration, idx) => (
                  <Chip 
                    key={idx}
                    label={consideration}
                    color="secondary"
                    variant="outlined"
                    size="medium"
                    sx={{ fontWeight: 500 }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              prevStep();
              navigate('/upload');
            }}
            sx={{
              borderColor: '#DFE1E5',
              color: 'text.primary',
              '&:hover': {
                borderColor: '#AECBFA',
                backgroundColor: 'rgba(66, 133, 244, 0.04)',
              },
              px: 3
            }}
          >
            Volver
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !selectedCase || !selectedLevel}
            sx={{ px: 3 }}
          >
            Continuar
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default CaseSelection; 