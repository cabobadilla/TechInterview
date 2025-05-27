import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Paper, Typography, Button, Box, Alert, 
  CircularProgress, Grid, Card, CardContent, 
  Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow,
  LinearProgress, Chip, Divider, useTheme
} from '@mui/material';
import { useAnalyzer } from '../context/AnalyzerContext';
import { useAuth } from '../context/AuthContext';

// Componente para mostrar puntuación con barra de progreso
const ScoreDisplay = ({ label, value }) => {
  const theme = useTheme();
  return (
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
        color="primary"
      />
    </Box>
  );
};

// Componente para mostrar etiquetas de estado
const StatusChip = ({ label }) => {
  return (
    <Chip 
      label={label} 
      color="primary"
      size="small"
      sx={{ 
        fontWeight: 400,
        borderRadius: 1,
        fontSize: '0.75rem'
      }}
    />
  );
};

const Results = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const { 
    qaPairs, 
    selectedCase, 
    selectedLevel,
    evaluationResults,
    prevStep,
    loading, 
    setLoading, 
    error, 
    setError 
  } = useAnalyzer();
  
  const { api } = useAuth();
  
  const [cases, setCases] = useState({});
  const [averageScores, setAverageScores] = useState({
    approach: 0,
    considerations: 0
  });
  const [debugInfo, setDebugInfo] = useState([]);
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const [fetchStartTime, setFetchStartTime] = useState(null);
  const [realTimeTimer, setRealTimeTimer] = useState(0);

  // Real-time timer for debugging
  React.useEffect(() => {
    let interval;
    if (isLoadingCases && fetchStartTime) {
      interval = setInterval(() => {
        setRealTimeTimer(Math.round((Date.now() - fetchStartTime) / 1000));
      }, 1000);
    } else {
      setRealTimeTimer(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoadingCases, fetchStartTime]);

  const addDebugInfo = (message) => {
    const timestamp = new Date().toISOString();
    const info = `[${timestamp}] ${message}`;
    console.log('RESULTS DEBUG:', info);
    setDebugInfo(prev => [...prev, info]);
  };
  
  // Validación inicial y carga de datos
  useEffect(() => {
    addDebugInfo('=== RESULTS PAGE INITIALIZATION ===');
    addDebugInfo(`QA Pairs: ${qaPairs ? qaPairs.length : 'null'}`);
    addDebugInfo(`Selected Case: ${selectedCase || 'null'}`);
    addDebugInfo(`Selected Level: ${selectedLevel || 'null'}`);
    addDebugInfo(`Evaluation Results: ${evaluationResults ? evaluationResults.length : 'null'}`);
    
    // Redireccionar si faltan datos críticos
    if (!qaPairs || qaPairs.length === 0) {
      addDebugInfo('❌ No QA pairs found, redirecting to upload');
      navigate('/upload');
      return;
    }
    
    if (!selectedCase || !selectedLevel) {
      addDebugInfo('❌ Missing case or level selection, redirecting to case selection');
      navigate('/select-case');
      return;
    }
    
    if (!evaluationResults || evaluationResults.length === 0) {
      addDebugInfo('❌ No evaluation results found, redirecting to case selection');
      setError('No evaluation results found. Please complete the evaluation process.');
      navigate('/select-case');
      return;
    }
    
    addDebugInfo('✅ All required data present, proceeding with initialization');
    
    // Cargar casos de estudio
    const fetchCases = async () => {
      try {
        setIsLoadingCases(true);
        setFetchStartTime(Date.now());
        
        addDebugInfo('🚀 Starting case studies fetch for results page...');
        addDebugInfo(`📡 API Base URL: ${api.defaults?.baseURL || 'Not set'}`);
        addDebugInfo('📡 Making request to: /api/case-studies');
        
        const response = await api.get('/api/case-studies');
        
        const duration = Date.now() - fetchStartTime;
        addDebugInfo(`✅ Case studies API call completed in ${duration}ms`);
        addDebugInfo(`📊 Response status: ${response.status}`);
        addDebugInfo(`📊 Response data type: ${typeof response.data}`);
        addDebugInfo(`📊 Response data keys: ${Object.keys(response.data || {}).length}`);
        
        if (response.data && typeof response.data === 'object') {
          const caseKeys = Object.keys(response.data);
          addDebugInfo(`📚 Case studies found: ${caseKeys.length}`);
          caseKeys.forEach((key, index) => {
            addDebugInfo(`  ${index + 1}. ${key}: ${response.data[key]?.name || 'No name'}`);
          });
          
          setCases(response.data);
          addDebugInfo('✅ Case studies set in state successfully');
        } else {
          addDebugInfo('❌ Invalid case studies response data format');
          throw new Error('Invalid response format');
        }
        
      } catch (error) {
        const duration = Date.now() - fetchStartTime;
        addDebugInfo(`❌ Case studies error occurred after ${duration}ms`);
        addDebugInfo(`❌ Error type: ${error.constructor.name}`);
        addDebugInfo(`❌ Error message: ${error.message}`);
        
        console.error('Error fetching cases:', error);
        
        if (error.response) {
          addDebugInfo(`❌ Response status: ${error.response.status}`);
          addDebugInfo(`❌ Response data: ${JSON.stringify(error.response.data)}`);
        }
        
        setError('Error loading case studies for display');
      } finally {
        addDebugInfo('🏁 Case studies fetch finally block...');
        setIsLoadingCases(false);
        const totalDuration = Date.now() - fetchStartTime;
        addDebugInfo(`🏁 Case studies fetch completed in ${totalDuration}ms`);
      }
    };
    
    fetchCases();
  }, [qaPairs, selectedCase, selectedLevel, evaluationResults, navigate, api, setError]);
  
  // Calcular promedios cuando se cargan los resultados
  useEffect(() => {
    if (evaluationResults && evaluationResults.length > 0) {
      addDebugInfo('🧮 Calculating average scores...');
      addDebugInfo(`📊 Processing ${evaluationResults.length} evaluation results`);
      
      try {
        // Validar que todos los resultados tengan las propiedades necesarias
        const validResults = evaluationResults.filter(result => {
          const hasApproach = typeof result.approach_score === 'number';
          const hasConsiderations = typeof result.key_considerations_score === 'number';
          
          if (!hasApproach || !hasConsiderations) {
            addDebugInfo(`⚠️ Invalid result found: approach_score=${result.approach_score}, key_considerations_score=${result.key_considerations_score}`);
          }
          
          return hasApproach && hasConsiderations;
        });
        
        addDebugInfo(`📊 Valid results for calculation: ${validResults.length}/${evaluationResults.length}`);
        
        if (validResults.length === 0) {
          addDebugInfo('❌ No valid results for score calculation');
          setError('Invalid evaluation results format');
          return;
        }
        
        const approachSum = validResults.reduce((sum, item) => {
          addDebugInfo(`  Adding approach score: ${item.approach_score}`);
          return sum + item.approach_score;
        }, 0);
        
        const considerationsSum = validResults.reduce((sum, item) => {
          addDebugInfo(`  Adding considerations score: ${item.key_considerations_score}`);
          return sum + item.key_considerations_score;
        }, 0);
        
        const avgApproach = Math.round(approachSum / validResults.length);
        const avgConsiderations = Math.round(considerationsSum / validResults.length);
        const overallScore = Math.round((avgApproach + avgConsiderations) / 2);
        
        addDebugInfo(`📊 Calculated averages:`);
        addDebugInfo(`  Approach: ${approachSum}/${validResults.length} = ${avgApproach}%`);
        addDebugInfo(`  Considerations: ${considerationsSum}/${validResults.length} = ${avgConsiderations}%`);
        addDebugInfo(`  Overall: (${avgApproach} + ${avgConsiderations})/2 = ${overallScore}%`);
        
        setAverageScores({
          approach: avgApproach,
          considerations: avgConsiderations
        });
        
        addDebugInfo('✅ Average scores calculated and set successfully');
      } catch (error) {
        addDebugInfo(`❌ Error calculating averages: ${error.message}`);
        console.error('Error calculating averages:', error);
        setError('Error calculating average scores');
      }
    } else {
      addDebugInfo('⚠️ No evaluation results available for average calculation');
    }
  }, [evaluationResults, setError]);
  
  // Función para descargar resultados como CSV
  const downloadCSV = () => {
    addDebugInfo('📥 Starting CSV download...');
    
    if (!evaluationResults) {
      addDebugInfo('❌ No evaluation results for CSV download');
      return;
    }
    
    try {
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
        result.question || '',
        result.candidate_answer || '',
        result.approach_evaluation || '',
        result.key_considerations_evaluation || '',
        result.approach_score || 0,
        result.key_considerations_score || 0,
        result.feedback || ''
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
      
      addDebugInfo('✅ CSV download completed successfully');
    } catch (error) {
      addDebugInfo(`❌ CSV download error: ${error.message}`);
      console.error('CSV download error:', error);
    }
  };
  
  return (
    <>
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 12 }}>
          <CircularProgress size={40} thickness={2} sx={{ mb: 3, color: '#7DE1C3' }} />
          <Typography variant="body1" color="text.secondary">
            Loading results...
          </Typography>
        </Box>
      ) : (
        <Box>
          <Paper elevation={0} sx={{ 
            p: { xs: 3, sm: 4 }, 
            borderRadius: 0, 
            border: '1px solid #1E3A54',
            mb: 5
          }}>
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              <Typography 
                variant="h3" 
                gutterBottom 
                sx={{ 
                  fontWeight: 400, 
                  mb: 3,
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
                Analysis of candidate responses for the case "{cases[selectedCase]?.name || selectedCase}" with expected level {selectedLevel}.
              </Typography>
              
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 4 }}
                >
                  {error}
                </Alert>
              )}

              {/* Debug Information Panel */}
              {debugInfo.length > 0 && (
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    mb: 4,
                    borderColor: '#1E3A54',
                    borderRadius: 0,
                    backgroundColor: 'rgba(125, 225, 195, 0.05)'
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ color: '#7DE1C3', fontWeight: 400 }}>
                    {isLoadingCases ? 'Loading Case Studies...' : 'Debug Information'}
                  </Typography>
                  
                  {isLoadingCases && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CircularProgress size={16} sx={{ mr: 1, color: '#7DE1C3' }} />
                      <Typography variant="body2" color="text.secondary">
                        Loading case studies for display...
                      </Typography>
                    </Box>
                  )}
                  
                  <Box 
                    sx={{ 
                      maxHeight: 300, 
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      lineHeight: 1.4
                    }}
                  >
                    {debugInfo.map((info, index) => (
                      <Typography 
                        key={index} 
                        variant="caption" 
                        component="div" 
                        sx={{ 
                          color: info.includes('❌') ? '#ff6b6b' : 
                                 info.includes('✅') || info.includes('🚀') ? '#7DE1C3' : 
                                 info.includes('⚠️') ? '#ffa726' :
                                 'text.secondary',
                          mb: 0.5
                        }}
                      >
                        {info}
                      </Typography>
                    ))}
                  </Box>
                  
                  {isLoadingCases && fetchStartTime && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                      Elapsed time: {realTimeTimer}s
                    </Typography>
                  )}
                </Paper>
              )}
              
              {evaluationResults && evaluationResults.length > 0 ? (
                <>
                  <Grid container spacing={4} sx={{ mb: 5 }}>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ height: '100%', borderRadius: 0 }}>
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
                      <Card variant="outlined" sx={{ height: '100%', borderRadius: 0 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 400, mb: 3 }}>
                            Evaluation Summary
                          </Typography>
                          
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Case:</strong> {cases[selectedCase]?.name || selectedCase}
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
                              py: 1
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
                      mb: 5
                    }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Question</TableCell>
                          <TableCell>Answer</TableCell>
                          <TableCell>Approach</TableCell>
                          <TableCell>Considerations</TableCell>
                          <TableCell>Feedback</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {evaluationResults.map((result, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ verticalAlign: 'top' }}>
                              <Typography variant="body2">{result.question || 'N/A'}</Typography>
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'top' }}>
                              <Typography variant="body2">{result.candidate_answer || 'N/A'}</Typography>
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'top' }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <StatusChip label={result.approach_evaluation || 'N/A'} />
                                <Typography variant="caption" color="text.secondary">
                                  Score: {result.approach_score || 0}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'top' }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <StatusChip label={result.key_considerations_evaluation || 'N/A'} />
                                <Typography variant="caption" color="text.secondary">
                                  Score: {result.key_considerations_score || 0}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'top' }}>
                              <Typography variant="body2">{result.feedback || 'N/A'}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <Alert severity="warning" sx={{ mb: 4 }}>
                  No evaluation results available. Please complete the evaluation process.
                </Alert>
              )}
              
              <Divider sx={{ my: 4 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="text"
                  onClick={() => {
                    prevStep();
                    navigate('/select-case');
                  }}
                >
                  Back
                </Button>
                
                <Button
                  variant="contained"
                  onClick={downloadCSV}
                  disabled={!evaluationResults || evaluationResults.length === 0}
                  sx={{ 
                    minWidth: 180,
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