import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Paper, Typography, Button, Box, Alert, 
  FormControl, InputLabel, Select, MenuItem, 
  Grid, Card, CardContent, Divider, Chip,
  useTheme, useMediaQuery, CircularProgress
} from '@mui/material';
import { useAnalyzer } from '../context/AnalyzerContext';
import { useAuth } from '../context/AuthContext';

const CaseSelection = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { 
    qaPairs, 
    transcriptId,
    setSelectedCase, 
    selectedCase,
    setSelectedLevel,
    selectedLevel,
    nextStep, 
    prevStep,
    loading, 
    error, 
    setError,
    setEvaluationResults
  } = useAnalyzer();
  
  const { api } = useAuth();
  
  const [cases, setCases] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);
  const [fetchStartTime, setFetchStartTime] = useState(null);
  const [realTimeTimer, setRealTimeTimer] = useState(0);

  // Real-time timer for debugging
  React.useEffect(() => {
    let interval;
    if (isLoading && fetchStartTime) {
      interval = setInterval(() => {
        setRealTimeTimer(Math.round((Date.now() - fetchStartTime) / 1000));
      }, 1000);
    } else {
      setRealTimeTimer(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, fetchStartTime]);

  const addDebugInfo = (message) => {
    const timestamp = new Date().toISOString();
    const info = `[${timestamp}] ${message}`;
    console.log('CASE STUDIES DEBUG:', info);
    setDebugInfo(prev => [...prev, info]);
  };
  
  // Redireccionar si no hay QA pairs
  useEffect(() => {
    if (!qaPairs || qaPairs.length === 0) {
      addDebugInfo('❌ No QA pairs found, redirecting to upload');
      navigate('/upload');
      return;
    }
    
    addDebugInfo(`✅ QA pairs found: ${qaPairs.length} pairs`);
    
    // Cargar casos de estudio
    const fetchCases = async () => {
      try {
        setIsLoading(true);
        setFetchStartTime(Date.now());
        setDebugInfo([]);
        
        addDebugInfo('🚀 Starting case studies fetch...');
        addDebugInfo(`📡 API Base URL: ${api.defaults?.baseURL || 'Not set'}`);
        addDebugInfo('📡 Making request to: /api/case-studies');
        
        const response = await api.get('/api/case-studies');
        
        const duration = Date.now() - fetchStartTime;
        addDebugInfo(`✅ API call completed in ${duration}ms`);
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
          addDebugInfo('❌ Invalid response data format');
          throw new Error('Invalid response format');
        }
        
      } catch (error) {
        const duration = Date.now() - fetchStartTime;
        addDebugInfo(`❌ Error occurred after ${duration}ms`);
        addDebugInfo(`❌ Error type: ${error.constructor.name}`);
        addDebugInfo(`❌ Error message: ${error.message}`);
        
        console.error('Error fetching cases:', error);
        
        if (error.response) {
          addDebugInfo(`❌ Response status: ${error.response.status}`);
          addDebugInfo(`❌ Response data: ${JSON.stringify(error.response.data)}`);
          
          if (error.response.status === 401) {
            addDebugInfo('🔐 Authentication error detected');
            setError('Authentication required. Please login again.');
          } else {
            addDebugInfo('🔧 Server error detected');
            setError(error.response?.data?.error || 'Failed to fetch case studies');
          }
        } else if (error.request) {
          addDebugInfo('🌐 Network error - no response received');
          addDebugInfo(`🌐 Request details: ${JSON.stringify(error.request)}`);
          setError('Network error. Please check your connection.');
        } else {
          addDebugInfo('⚙️ Request setup error');
          setError('Failed to fetch case studies');
        }
      } finally {
        addDebugInfo('🏁 Entering finally block...');
        setIsLoading(false);
        const totalDuration = Date.now() - fetchStartTime;
        addDebugInfo(`🏁 Total process completed in ${totalDuration}ms`);
        addDebugInfo('=== CASE STUDIES FETCH COMPLETE ===');
      }
    };
    
    fetchCases();
  }, [qaPairs, navigate, api]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== CLIENT EVALUATION START ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Selected case:', selectedCase);
    console.log('Selected level:', selectedLevel);
    console.log('QA pairs count:', qaPairs ? qaPairs.length : 0);
    
    if (!selectedCase) {
      console.log('ERROR: No case study selected');
      setError('Please select a case study');
      return;
    }
    
    if (!selectedLevel) {
      console.log('ERROR: No experience level selected');
      setError('Please select an experience level');
      return;
    }

    if (!transcriptId) {
      console.log('ERROR: No transcript ID found');
      setError('Transcript ID missing. Please upload transcript again.');
      return;
    }
    
    const evaluationStartTime = Date.now();
    
    try {
      setIsEvaluating(true);
      setError('');
      
      console.log('Step 1: Starting evaluation API call...');
      console.log('Request payload:', {
        qa_pairs_count: qaPairs.length,
        case_study_key: selectedCase,
        level: selectedLevel,
        transcript_id: transcriptId
      });
      
      const response = await api.post('/api/evaluate', {
        qa_pairs: qaPairs,
        case_study_key: selectedCase,
        level: selectedLevel,
        transcript_id: transcriptId
      });
      
      const evaluationDuration = Date.now() - evaluationStartTime;
      console.log('Step 2: Evaluation API call completed in', evaluationDuration, 'ms');
      
      console.log('Step 3: Processing evaluation response...');
      console.log('Response structure:', {
        hasData: !!response.data,
        hasEvaluationResults: !!response.data.evaluation_results,
        resultsCount: response.data.evaluation_results ? response.data.evaluation_results.length : 0
      });
      
      if (!response.data.evaluation_results || response.data.evaluation_results.length === 0) {
        console.log('ERROR: No evaluation results in response');
        throw new Error('No evaluation results received from server');
      }
      
      console.log('Step 4: Setting evaluation results in context...');
      setEvaluationResults(response.data.evaluation_results);
      console.log('Step 5: Evaluation results set successfully');
      
      console.log('Step 6: Advancing to next step...');
      nextStep();
      console.log('Step 7: Step advanced successfully');
      
      console.log('Step 8: Navigating to results page...');
      navigate('/results');
      console.log('Step 9: Navigation completed successfully');
      console.log('=== CLIENT EVALUATION SUCCESS ===');
    } catch (error) {
      const evaluationDuration = Date.now() - evaluationStartTime;
      console.error('=== CLIENT EVALUATION ERROR ===');
      console.error('Error occurred after', evaluationDuration, 'ms');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error details:', error);
      
      if (error.response) {
        console.error('Server response status:', error.response.status);
        console.error('Server response data:', error.response.data);
      }
      
      if (error.response?.status === 401) {
        console.log('Authentication error detected');
        setError('Authentication required. Please login again.');
      } else {
        console.log('Setting general error message');
        setError(error.response?.data?.error || 'Failed to evaluate answers');
      }
      console.error('=== CLIENT EVALUATION ERROR END ===');
    } finally {
      console.log('Step 10: Entering finally block...');
      setIsEvaluating(false);
      console.log('Step 11: Evaluation loading set to false');
      const totalDuration = Date.now() - evaluationStartTime;
      console.log('Step 12: Total evaluation process completed in', totalDuration, 'ms');
    }
  };
  
  return (
    <Paper elevation={0} sx={{ 
      p: { xs: 3, sm: 4 }, 
      borderRadius: 0, 
      border: '1px solid #1E3A54',
      mb: 5
    }}>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 400, 
            mb: 3,
            letterSpacing: '-0.02em'
          }}
        >
          Select Case Study
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary" 
          paragraph 
          sx={{ mb: 4, maxWidth: 560 }}
        >
          Select the case study discussed in the interview and the expected level of the candidate.
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
        {(isLoading || debugInfo.length > 0) && (
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
              {isLoading ? 'Loading Case Studies...' : 'Debug Information'}
            </Typography>
            
            {isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CircularProgress size={16} sx={{ mr: 1, color: '#7DE1C3' }} />
                <Typography variant="body2" color="text.secondary">
                  Fetching case studies from server...
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
                           'text.secondary',
                    mb: 0.5
                  }}
                >
                  {info}
                </Typography>
              ))}
            </Box>
            
            {isLoading && fetchStartTime && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Elapsed time: {realTimeTimer}s
              </Typography>
            )}
          </Paper>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 400 }}>
                Case Study
              </Typography>
              <FormControl fullWidth variant="outlined">
                <Select
                  value={selectedCase || ''}
                  onChange={(e) => setSelectedCase(e.target.value)}
                  displayEmpty
                  sx={{
                    height: 54,
                    borderRadius: 0
                  }}
                >
                  <MenuItem value="" disabled>
                    <Typography color="text.secondary">Select a case study</Typography>
                  </MenuItem>
                  {Object.keys(cases).map((caseKey) => (
                    <MenuItem key={caseKey} value={caseKey}>
                      {cases[caseKey].name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 400 }}>
                Expected Level
              </Typography>
              <FormControl fullWidth variant="outlined">
                <Select
                  value={selectedLevel || ''}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  displayEmpty
                  sx={{
                    height: 54,
                    borderRadius: 0
                  }}
                >
                  <MenuItem value="" disabled>
                    <Typography color="text.secondary">Select an experience level</Typography>
                  </MenuItem>
                  <MenuItem value="L1">L1 (Junior)</MenuItem>
                  <MenuItem value="L2">L2 (Intermediate)</MenuItem>
                  <MenuItem value="L3">L3 (Senior)</MenuItem>
                  <MenuItem value="L4">L4 (Expert)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {selectedCase && cases[selectedCase] && (
            <Card 
              variant="outlined" 
              sx={{ 
                mt: 5, 
                mb: 4, 
                borderRadius: 0
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 400, mb: 2 }}>
                  {cases[selectedCase].name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 3 }}>
                  <strong>Objective:</strong> {cases[selectedCase].objective}
                </Typography>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, fontWeight: 400 }}>
                  Expected Process:
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {cases[selectedCase].process_answer.map((process, idx) => (
                    <Chip 
                      key={idx}
                      label={process}
                      color="primary"
                      size="small"
                      sx={{ 
                        fontWeight: 400,
                        borderRadius: 1
                      }}
                    />
                  ))}
                </Box>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, fontWeight: 400 }}>
                  Key Considerations:
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {cases[selectedCase].key_considerations_answer.map((consideration, idx) => (
                    <Chip 
                      key={idx}
                      label={consideration}
                      color="primary"
                      size="small"
                      sx={{ 
                        fontWeight: 400,
                        borderRadius: 1
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
          
          <Divider sx={{ my: 4 }} />
          
          {isEvaluating && (
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
                Evaluating Responses...
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CircularProgress size={16} sx={{ mr: 1, color: '#7DE1C3' }} />
                <Typography variant="body2" color="text.secondary">
                  Analyzing candidate responses with AI. This may take up to 2 minutes.
                </Typography>
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                Please wait while we evaluate the interview responses against the selected case study...
              </Typography>
            </Paper>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="text"
              onClick={() => {
                prevStep();
                navigate('/upload');
              }}
              disabled={isEvaluating}
            >
              Back
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !selectedCase || !selectedLevel || isEvaluating}
              sx={{ 
                minWidth: 120,
                py: 1
              }}
            >
              {isEvaluating ? (
                <>
                  <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                  Evaluating...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default CaseSelection; 