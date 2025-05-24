import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Paper, Typography, Button, Box, Alert, 
  CircularProgress, FormControl, InputLabel,
  Select, MenuItem, Grid, Card, CardContent, 
  Divider, Chip
} from '@mui/material';
import { useAnalyzer } from '../context/AnalyzerContext';
import axios from 'axios';

const CaseSelection = () => {
  const navigate = useNavigate();
  const { 
    qaPairs, 
    setSelectedCase, 
    selectedCase,
    setSelectedLevel,
    selectedLevel,
    nextStep, 
    prevStep,
    loading, 
    setLoading, 
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
  
  return (
    <Paper elevation={0} sx={{ p: 4, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Paso 2: Selecciona el caso de estudio y nivel
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Selecciona el caso de estudio que se discutió en la entrevista y el nivel esperado del candidato.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Caso de Estudio</InputLabel>
              <Select
                value={selectedCase || ''}
                onChange={(e) => setSelectedCase(e.target.value)}
                label="Caso de Estudio"
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
            <FormControl fullWidth>
              <InputLabel>Nivel Esperado</InputLabel>
              <Select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                label="Nivel Esperado"
              >
                <MenuItem value="L1">L1 (Junior)</MenuItem>
                <MenuItem value="L2">L2 (Intermedio)</MenuItem>
                <MenuItem value="L3">L3 (Senior)</MenuItem>
                <MenuItem value="L4">L4 (Experto)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {selectedCase && cases[selectedCase] && (
          <Card variant="outlined" sx={{ mt: 4, mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {cases[selectedCase].name}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Objetivo:</strong> {cases[selectedCase].objective}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Proceso Esperado:
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {cases[selectedCase].process_answer.map((process, idx) => (
                  <Chip 
                    key={idx}
                    label={process}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Consideraciones Clave:
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {cases[selectedCase].key_considerations_answer.map((consideration, idx) => (
                  <Chip 
                    key={idx}
                    label={consideration}
                    color="secondary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => {
              prevStep();
              navigate('/upload');
            }}
          >
            Volver
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !selectedCase || !selectedLevel}
          >
            Continuar
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default CaseSelection; 