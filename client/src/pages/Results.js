import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Paper, Typography, Button, Box, Alert, 
  CircularProgress, Grid, Card, CardContent, 
  Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow,
  LinearProgress, Chip, Divider
} from '@mui/material';
import { useAnalyzer } from '../context/AnalyzerContext';
import axios from 'axios';

// Componente para mostrar puntuación con barra de progreso
const ScoreDisplay = ({ label, value }) => (
  <Box sx={{ mb: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 400 }}>
        {value}%
      </Typography>
    </Box>
    <LinearProgress 
      variant="determinate" 
      value={value} 
      sx={{ 
        height: 4, 
        borderRadius: 0,
        backgroundColor: '#F2F2F2',
        '& .MuiLinearProgress-bar': {
          backgroundColor: '#000000',
        }
      }}
    />
  </Box>
);

// Componente para mostrar etiquetas de estado
const StatusChip = ({ label }) => {
  return (
    <Chip 
      label={label} 
      variant="outlined"
      size="small"
      sx={{ 
        fontWeight: 400, 
        borderColor: '#E0E0E0',
        borderRadius: 1,
        color: '#000000',
        fontSize: '0.75rem'
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
        setError('Error loading case studies');
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
          throw new Error('No evaluation results were obtained');
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
        setError(err.response?.data?.error || err.message || 'Error evaluating responses');
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
      'Question', 
      'Answer', 
      'Approach Evaluation', 
      'Considerations Evaluation',
      'Approach Score', 
      'Considerations Score',
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
    link.setAttribute('download', 'interview_evaluation.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <>
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 12 }}>
          <CircularProgress size={40} thickness={2} sx={{ mb: 3, color: '#000000' }} />
          <Typography variant="body1" sx={{ color: '#4F4F4F' }}>
            Evaluating responses...
          </Typography>
        </Box>
      ) : (
        <Box>
          <Paper elevation={0} sx={{ 
            p: { xs: 3, sm: 4 }, 
            borderRadius: 0, 
            border: '1px solid #E0E0E0',
            mb: 5
          }}>
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              <Typography 
                variant="h3" 
                gutterBottom 
                sx={{ 
                  fontWeight: 400, 
                  mb: 3, 
                  color: '#000000',
                  letterSpacing: '-0.02em'
                }}
              >
                Evaluation Results
              </Typography>
              
              <Typography 
                variant="body1" 
                color="text.secondary" 
                paragraph 
                sx={{ mb: 4, maxWidth: 560 }}
              >
                Analysis of candidate responses for the case "{cases[selectedCase]?.name}" with expected level {selectedLevel}.
              </Typography>
              
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 4, 
                    borderRadius: 0,
                    border: '1px solid #EB5757',
                    backgroundColor: 'transparent',
                    color: '#EB5757',
                    '& .MuiAlert-icon': { color: '#EB5757' }
                  }}
                >
                  {error}
                </Alert>
              )}
              
              {evaluationResults && (
                <>
                  <Grid container spacing={4} sx={{ mb: 5 }}>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ height: '100%', borderRadius: 0, border: '1px solid #E0E0E0' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 400, mb: 3 }}>
                            Overall Score
                          </Typography>
                          
                          <ScoreDisplay 
                            label="Methodological Approach" 
                            value={averageScores.approach} 
                          />
                          
                          <ScoreDisplay 
                            label="Key Considerations" 
                            value={averageScores.considerations} 
                          />
                          
                          <ScoreDisplay 
                            label="Overall Score" 
                            value={Math.round((averageScores.approach + averageScores.considerations) / 2)} 
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ height: '100%', borderRadius: 0, border: '1px solid #E0E0E0' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 400, mb: 3 }}>
                            Evaluation Summary
                          </Typography>
                          
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Case:</strong> {cases[selectedCase]?.name}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Expected Level:</strong> {selectedLevel}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Questions Evaluated:</strong> {evaluationResults.length}
                            </Typography>
                          </Box>
                          
                          <Button 
                            variant="outlined" 
                            onClick={downloadCSV}
                            fullWidth
                            sx={{ 
                              mt: 3,
                              borderColor: '#E0E0E0',
                              color: '#000000',
                              borderRadius: 0,
                              py: 1,
                              '&:hover': {
                                borderColor: '#000000',
                                backgroundColor: 'transparent'
                              },
                            }}
                          >
                            Download Results (CSV)
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                  
                  <Typography variant="h5" gutterBottom sx={{ mt: 5, mb: 3, fontWeight: 400 }}>
                    Detailed Evaluation
                  </Typography>
                  
                  <TableContainer 
                    component={Paper} 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: 0, 
                      border: '1px solid #E0E0E0',
                      boxShadow: 'none',
                      mb: 5
                    }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#FAFAFA' }}>
                          <TableCell sx={{ fontWeight: 400, color: '#4F4F4F', borderBottom: '1px solid #E0E0E0' }}>Question</TableCell>
                          <TableCell sx={{ fontWeight: 400, color: '#4F4F4F', borderBottom: '1px solid #E0E0E0' }}>Answer</TableCell>
                          <TableCell sx={{ fontWeight: 400, color: '#4F4F4F', borderBottom: '1px solid #E0E0E0' }}>Approach</TableCell>
                          <TableCell sx={{ fontWeight: 400, color: '#4F4F4F', borderBottom: '1px solid #E0E0E0' }}>Considerations</TableCell>
                          <TableCell sx={{ fontWeight: 400, color: '#4F4F4F', borderBottom: '1px solid #E0E0E0' }}>Feedback</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {evaluationResults.map((result, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ verticalAlign: 'top', borderBottom: '1px solid #E0E0E0' }}>
                              <Typography variant="body2">{result.question}</Typography>
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'top', borderBottom: '1px solid #E0E0E0' }}>
                              <Typography variant="body2">{result.candidate_answer}</Typography>
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'top', borderBottom: '1px solid #E0E0E0' }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <StatusChip label={result.approach_evaluation} />
                                <Typography variant="caption" sx={{ color: '#4F4F4F' }}>
                                  Score: {result.approach_score}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'top', borderBottom: '1px solid #E0E0E0' }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <StatusChip label={result.key_considerations_evaluation} />
                                <Typography variant="caption" sx={{ color: '#4F4F4F' }}>
                                  Score: {result.key_considerations_score}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'top', borderBottom: '1px solid #E0E0E0' }}>
                              <Typography variant="body2">{result.feedback}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
              
              <Divider sx={{ my: 4, borderColor: '#E0E0E0' }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="text"
                  onClick={() => {
                    prevStep();
                    navigate('/case-selection');
                  }}
                  sx={{
                    color: '#4F4F4F',
                    '&:hover': {
                      color: '#000000',
                      backgroundColor: 'transparent'
                    }
                  }}
                >
                  Back
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={downloadCSV}
                  disabled={!evaluationResults}
                  sx={{ 
                    minWidth: 180,
                    borderColor: '#E0E0E0',
                    color: '#000000',
                    borderRadius: 0,
                    '&:hover': {
                      borderColor: '#000000',
                      backgroundColor: 'transparent'
                    },
                    py: 1
                  }}
                >
                  Download Results
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
    </>
  );
};

export default Results; 