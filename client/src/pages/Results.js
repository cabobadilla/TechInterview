import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Paper, Typography, Button, Box, Alert, 
  CircularProgress, Grid, Card, CardContent, 
  Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow,
  LinearProgress, Chip
} from '@mui/material';
import { useAnalyzer } from '../context/AnalyzerContext';
import axios from 'axios';

// Componente para mostrar puntuación con barra de progreso
const ScoreDisplay = ({ label, value }) => {
  const getColorByScore = (score) => {
    if (score >= 80) return 'success.main';
    if (score >= 50) return 'warning.main';
    return 'error.main';
  };

  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8, alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ 
          color: getColorByScore(value),
          display: 'flex',
          alignItems: 'center',
          backgroundColor: `${getColorByScore(value)}15`,
          px: 1.5,
          py: 0.5,
          borderRadius: 4
        }}>
          {value}%
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={value} 
        sx={{ 
          height: 8, 
          borderRadius: 4,
          backgroundColor: 'grey.100',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            backgroundColor: getColorByScore(value),
          }
        }}
      />
    </Box>
  );
};

// Componente para mostrar etiquetas de estado
const StatusChip = ({ label, type }) => {
  let color = 'default';
  let icon = null;
  
  if (type === 'approach') {
    if (label === 'High') color = 'success';
    else if (label === 'Medium') color = 'warning';
    else if (label === 'Low') color = 'error';
  } else {
    if (label === 'Correct') color = 'success';
    else if (label === 'Partially Correct') color = 'warning';
    else if (label === 'Incorrect') color = 'error';
  }
  
  return (
    <Chip 
      label={label} 
      color={color} 
      size="medium" 
      variant="filled"
      sx={{ 
        fontWeight: 500,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}
    />
  );
};

const Results = () => {
  const navigate = useNavigate();
  const { 
    qaPairs, 
    selectedCase, 
    selectedLevel,
    setEvaluationResults,
    evaluationResults,
    prevStep,
    loading, 
    setLoading, 
    error, 
    setError 
  } = useAnalyzer();
  
  const [cases, setCases] = useState({});
  const [averageScores, setAverageScores] = useState({
    approach: 0,
    considerations: 0
  });
  
  // Redireccionar si faltan datos
  useEffect(() => {
    if (!qaPairs || qaPairs.length === 0 || !selectedCase || !selectedLevel) {
      navigate('/case-selection');
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
  }, [qaPairs, selectedCase, selectedLevel, navigate, setError]);
  
  // Evaluar respuestas
  useEffect(() => {
    const evaluateAnswers = async () => {
      if (!qaPairs || !selectedCase || !selectedLevel) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.post('/api/evaluate', {
          qa_pairs: qaPairs,
          case_study_key: selectedCase,
          level: selectedLevel
        });
        
        const results = response.data.evaluation_results;
        
        if (!results || results.length === 0) {
          throw new Error('No se obtuvieron resultados de evaluación');
        }
        
        setEvaluationResults(results);
        
        // Calcular promedios
        const approachSum = results.reduce((sum, item) => sum + item.approach_score, 0);
        const considerationsSum = results.reduce((sum, item) => sum + item.key_considerations_score, 0);
        
        setAverageScores({
          approach: Math.round(approachSum / results.length),
          considerations: Math.round(considerationsSum / results.length)
        });
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Error al evaluar las respuestas');
      } finally {
        setLoading(false);
      }
    };
    
    if (!evaluationResults) {
      evaluateAnswers();
    }
  }, [qaPairs, selectedCase, selectedLevel, evaluationResults, setEvaluationResults, setLoading, setError]);
  
  // Función para descargar resultados como CSV
  const downloadCSV = () => {
    if (!evaluationResults) return;
    
    const headers = [
      'Pregunta', 
      'Respuesta', 
      'Evaluación de Enfoque', 
      'Evaluación de Consideraciones',
      'Puntuación de Enfoque', 
      'Puntuación de Consideraciones',
      'Feedback'
    ];
    
    const rows = evaluationResults.map(result => [
      result.question,
      result.candidate_answer,
      result.approach_evaluation,
      result.key_considerations_evaluation,
      result.approach_score,
      result.key_considerations_score,
      result.feedback
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'evaluacion_entrevista.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <>
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 8, py: 6 }}>
          <CircularProgress size={56} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.secondary' }}>
            Evaluando respuestas...
          </Typography>
        </Box>
      ) : (
        <Box>
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 2, mb: 4, border: '1px solid #E8EAED' }}>
            <Typography variant="h4" gutterBottom fontWeight={500} color="text.primary">
              Paso 3: Resultados de la Evaluación
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
              Análisis de las respuestas del candidato para el caso "{cases[selectedCase]?.name}" con nivel esperado {selectedLevel}.
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
            
            {evaluationResults && (
              <>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ height: '100%', borderColor: '#E8EAED' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: 'text.primary', mb: 2 }}>
                          Puntuación General
                        </Typography>
                        
                        <ScoreDisplay 
                          label="Enfoque Metodológico" 
                          value={averageScores.approach} 
                        />
                        
                        <ScoreDisplay 
                          label="Consideraciones Clave" 
                          value={averageScores.considerations} 
                        />
                        
                        <ScoreDisplay 
                          label="Puntuación General" 
                          value={Math.round((averageScores.approach + averageScores.considerations) / 2)} 
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ height: '100%', borderColor: '#E8EAED' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: 'text.primary', mb: 2 }}>
                          Resumen de Evaluación
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ width: 140, color: 'text.secondary' }}>
                              Caso:
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {cases[selectedCase]?.name}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ width: 140, color: 'text.secondary' }}>
                              Nivel Esperado:
                            </Typography>
                            <Chip 
                              label={selectedLevel} 
                              color="primary" 
                              variant="outlined" 
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ width: 140, color: 'text.secondary' }}>
                              Preguntas:
                            </Typography>
                            <Chip 
                              label={evaluationResults.length} 
                              color="primary" 
                              variant="filled" 
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                          </Box>
                        </Box>
                        
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          fullWidth
                          onClick={downloadCSV}
                          sx={{ mt: 3 }}
                          startIcon={<Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
                            </svg>
                          </Box>}
                        >
                          Descargar Resultados (CSV)
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 3, fontWeight: 500 }}>
                  Evaluación Detallada
                </Typography>
                
                <TableContainer 
                  component={Paper} 
                  variant="outlined" 
                  sx={{ 
                    borderRadius: 2, 
                    overflow: 'hidden', 
                    borderColor: '#E8EAED',
                    boxShadow: 'none',
                    mb: 3
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell width="24%" sx={{ backgroundColor: '#F8F9FA', fontWeight: 500 }}>Pregunta</TableCell>
                        <TableCell width="24%" sx={{ backgroundColor: '#F8F9FA', fontWeight: 500 }}>Respuesta</TableCell>
                        <TableCell width="15%" sx={{ backgroundColor: '#F8F9FA', fontWeight: 500 }}>Enfoque</TableCell>
                        <TableCell width="15%" sx={{ backgroundColor: '#F8F9FA', fontWeight: 500 }}>Consideraciones</TableCell>
                        <TableCell width="22%" sx={{ backgroundColor: '#F8F9FA', fontWeight: 500 }}>Feedback</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {evaluationResults.map((result, index) => (
                        <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#FAFAFA' } }}>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            <Typography variant="body2">{result.question}</Typography>
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            <Typography variant="body2">{result.candidate_answer}</Typography>
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                              <StatusChip 
                                label={result.approach_evaluation} 
                                type="approach"
                              />
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                Puntuación: {result.approach_score}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                              <StatusChip 
                                label={result.key_considerations_evaluation} 
                                type="considerations"
                              />
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                Puntuación: {result.key_considerations_score}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            <Typography variant="body2">{result.feedback}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  prevStep();
                  navigate('/case-selection');
                }}
                sx={{
                  borderColor: '#DFE1E5',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: '#AECBFA',
                    backgroundColor: 'rgba(66, 133, 244, 0.04)',
                  }
                }}
              >
                Volver
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                onClick={downloadCSV}
                disabled={!evaluationResults}
                startIcon={<Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
                  </svg>
                </Box>}
              >
                Descargar Resultados
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </>
  );
};

export default Results; 