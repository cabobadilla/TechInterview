import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Paper, Typography, Button, Box, Alert, 
  CircularProgress, Grid, Card, CardContent, 
  Divider, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow,
  LinearProgress, Chip
} from '@mui/material';
import { useAnalyzer } from '../context/AnalyzerContext';
import axios from 'axios';

// Componente para mostrar puntuación con barra de progreso
const ScoreDisplay = ({ label, value }) => (
  <Box sx={{ mb: 1.5 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}%
      </Typography>
    </Box>
    <LinearProgress 
      variant="determinate" 
      value={value} 
      sx={{ 
        height: 8, 
        borderRadius: 4,
        backgroundColor: 'grey.200',
        '& .MuiLinearProgress-bar': {
          borderRadius: 4,
          backgroundColor: value >= 80 ? 'success.main' : value >= 50 ? 'warning.main' : 'error.main',
        }
      }}
    />
  </Box>
);

// Componente para mostrar etiquetas de estado
const StatusChip = ({ label, type }) => {
  let color = 'default';
  
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
      size="small" 
      variant="filled"
      sx={{ fontWeight: 500 }}
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
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 8 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Evaluando respuestas...
          </Typography>
        </Box>
      ) : (
        <Box>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 2, mb: 4 }}>
            <Typography variant="h5" gutterBottom fontWeight={600}>
              Paso 3: Resultados de la Evaluación
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              Análisis de las respuestas del candidato para el caso "{cases[selectedCase]?.name}" con nivel esperado {selectedLevel}.
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {evaluationResults && (
              <>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
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
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Resumen de Evaluación
                        </Typography>
                        
                        <Typography variant="body2" paragraph>
                          <strong>Caso:</strong> {cases[selectedCase]?.name}
                        </Typography>
                        
                        <Typography variant="body2" paragraph>
                          <strong>Nivel Esperado:</strong> {selectedLevel}
                        </Typography>
                        
                        <Typography variant="body2" paragraph>
                          <strong>Preguntas Evaluadas:</strong> {evaluationResults.length}
                        </Typography>
                        
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          fullWidth
                          onClick={downloadCSV}
                          sx={{ mt: 1 }}
                        >
                          Descargar Resultados (CSV)
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                <Typography variant="h6" gutterBottom>
                  Evaluación Detallada
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.100' }}>
                        <TableCell width="25%"><strong>Pregunta</strong></TableCell>
                        <TableCell width="25%"><strong>Respuesta</strong></TableCell>
                        <TableCell width="15%"><strong>Enfoque</strong></TableCell>
                        <TableCell width="15%"><strong>Consideraciones</strong></TableCell>
                        <TableCell width="20%"><strong>Feedback</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {evaluationResults.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            {result.question}
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            {result.candidate_answer}
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            <StatusChip 
                              label={result.approach_evaluation} 
                              type="approach"
                            />
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Puntuación: {result.approach_score}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            <StatusChip 
                              label={result.key_considerations_evaluation} 
                              type="considerations"
                            />
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Puntuación: {result.key_considerations_score}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            {result.feedback}
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
              >
                Volver
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                onClick={downloadCSV}
                disabled={!evaluationResults}
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