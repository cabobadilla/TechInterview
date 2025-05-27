import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack,
  Download,
  Assessment,
  Schedule,
  Person
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useLogs } from '../context/LogsContext';

const EvaluationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const { addLog } = useLogs();
  
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('EvaluationDetails component mounted');
    console.log('Evaluation ID from params:', id);
    console.log('API object:', api);
    console.log('addLog function:', addLog);
    
    addLog('=== EVALUATION DETAILS PAGE INITIALIZATION ===', 'info', 'EvaluationDetails');
    addLog(`Evaluation ID: ${id}`, 'info', 'EvaluationDetails');
    addLog(`API available: ${!!api}`, 'info', 'EvaluationDetails');
    
    if (id) {
      addLog('🚀 Starting fetchEvaluationDetails...', 'info', 'EvaluationDetails');
      fetchEvaluationDetails();
    } else {
      addLog('❌ No evaluation ID provided', 'error', 'EvaluationDetails');
      setError('No evaluation ID provided');
      setLoading(false);
    }
  }, [id]);

  const fetchEvaluationDetails = async () => {
    addLog('📍 fetchEvaluationDetails function called', 'info', 'EvaluationDetails');
    console.log('fetchEvaluationDetails function called');
    
    try {
      addLog('🔄 Setting loading state...', 'info', 'EvaluationDetails');
      setLoading(true);
      setError(null);
      
      addLog('🔍 Starting evaluation details fetch...', 'info', 'EvaluationDetails');
      addLog(`📊 Fetching evaluation with ID: ${id}`, 'info', 'EvaluationDetails');
      addLog(`🌐 API base URL: ${api?.defaults?.baseURL || 'undefined'}`, 'info', 'EvaluationDetails');
      
      console.log('Making API call to:', `/api/evaluations/${id}`);
      console.log('API object details:', {
        baseURL: api?.defaults?.baseURL,
        headers: api?.defaults?.headers,
        timeout: api?.defaults?.timeout
      });
      
      addLog('🚀 Making API request...', 'info', 'EvaluationDetails');
      const response = await api.get(`/api/evaluations/${id}`);
      
      console.log('API response received:', response);
      console.log('Response data:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      addLog(`✅ API response received with status: ${response.status}`, 'success', 'EvaluationDetails');
      addLog(`📦 Response data keys: ${Object.keys(response.data || {}).join(', ')}`, 'info', 'EvaluationDetails');
      
      if (response.data) {
        addLog(`📊 Evaluation data: ${response.data.case_study_name || 'Unknown'} - ${response.data.expected_level || 'Unknown'}`, 'info', 'EvaluationDetails');
        addLog(`📊 Questions count: ${response.data.questions?.length || 0}`, 'info', 'EvaluationDetails');
        setEvaluation(response.data);
        addLog(`✅ Evaluation details loaded successfully`, 'success', 'EvaluationDetails');
      } else {
        addLog('❌ No data in API response', 'error', 'EvaluationDetails');
        setError('No evaluation data received');
      }
      
    } catch (err) {
      console.error('Error fetching evaluation details:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: err.config
      });
      
      addLog(`❌ API call failed: ${err.message}`, 'error', 'EvaluationDetails');
      addLog(`🔧 Error type: ${err.constructor.name}`, 'error', 'EvaluationDetails');
      
      if (err.response) {
        addLog(`📊 Response status: ${err.response.status}`, 'error', 'EvaluationDetails');
        addLog(`📊 Response data: ${JSON.stringify(err.response.data)}`, 'error', 'EvaluationDetails');
        
        if (err.response.status === 404) {
          addLog('❌ Evaluation not found (404)', 'error', 'EvaluationDetails');
          setError('Evaluation not found');
        } else if (err.response.status === 403) {
          addLog('❌ Access denied to evaluation (403)', 'error', 'EvaluationDetails');
          setError('Access denied to this evaluation');
        } else if (err.response.status === 401) {
          addLog('🔐 Authentication error - user may need to login again', 'error', 'EvaluationDetails');
          setError('Authentication required. Please login again.');
        } else {
          addLog(`🔧 Server error: ${JSON.stringify(err.response.data)}`, 'error', 'EvaluationDetails');
          setError(`Server error (${err.response.status}): ${err.response.statusText}`);
        }
      } else if (err.request) {
        addLog('🌐 Network error - no response received', 'error', 'EvaluationDetails');
        addLog(`📊 Request details: ${JSON.stringify(err.request)}`, 'error', 'EvaluationDetails');
        setError('Network error - unable to reach server');
      } else {
        addLog(`⚙️ Request setup error: ${err.message}`, 'error', 'EvaluationDetails');
        setError(`Request error: ${err.message}`);
      }
    } finally {
      addLog('🏁 Setting loading to false...', 'info', 'EvaluationDetails');
      setLoading(false);
      addLog('🏁 Evaluation details fetch completed', 'info', 'EvaluationDetails');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#7DE1C3';
    if (score >= 60) return '#ffa726';
    return '#ff6b6b';
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const downloadCSV = () => {
    if (!evaluation || !evaluation.questions) {
      addLog('❌ No evaluation data for CSV download', 'error', 'EvaluationDetails');
      return;
    }

    addLog('📥 Starting CSV download from evaluation details...', 'info', 'EvaluationDetails');
    
    try {
      const headers = [
        'Question', 
        'Answer', 
        'Expert Answer',
        'Approach Evaluation', 
        'Considerations Evaluation',
        'Approach Score', 
        'Considerations Score',
        'Feedback'
      ];
      
      const rows = evaluation.questions.map(question => [
        question.question || '',
        question.candidate_answer || '',
        question.expert_answer || '',
        question.approach_evaluation || '',
        question.key_considerations_evaluation || '',
        question.approach_score || 0,
        question.key_considerations_score || 0,
        question.feedback || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `evaluation-${evaluation.case_study_name || 'unknown'}-${evaluation.expected_level || 'unknown'}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addLog('✅ CSV download completed successfully', 'success', 'EvaluationDetails');
    } catch (error) {
      addLog(`❌ CSV download error: ${error.message}`, 'error', 'EvaluationDetails');
      console.error('CSV download error:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={40} thickness={2} sx={{ color: '#7DE1C3', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading evaluation details...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/history')}
        >
          Back to History
        </Button>
      </Container>
    );
  }

  // No data state
  if (!evaluation) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          No evaluation data found
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/history')}
        >
          Back to History
        </Button>
      </Container>
    );
  }

  // Main content
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/history')}
          sx={{ minWidth: 'auto' }}
        >
          Back
        </Button>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#7DE1C3', mb: 0 }}>
            Evaluation Details
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {evaluation.case_study_name || 'Unknown Case Study'} - {evaluation.expected_level || 'Unknown Level'}
          </Typography>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #1E3A54', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assessment sx={{ fontSize: 40, color: '#7DE1C3', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#7DE1C3', fontWeight: 'bold' }}>
                {evaluation.overall_score || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overall Score
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #1E3A54', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Person sx={{ fontSize: 40, color: '#7DE1C3', mb: 1 }} />
              <Typography variant="h6" sx={{ color: '#7DE1C3' }}>
                {evaluation.expected_level || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expected Level
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #1E3A54', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 40, color: '#7DE1C3', mb: 1 }} />
              <Typography variant="h6" sx={{ color: '#7DE1C3' }}>
                {evaluation.questions?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Questions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #1E3A54', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#7DE1C3' }}>
                {evaluation.created_at ? formatDate(evaluation.created_at).split(',')[0] : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Date
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Score Breakdown */}
      <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #1E3A54', mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#7DE1C3', mb: 3 }}>
            Score Breakdown
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Methodological Approach
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {evaluation.overall_approach_score || 0}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={evaluation.overall_approach_score || 0} 
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#1E3A54',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getScoreColor(evaluation.overall_approach_score || 0),
                      borderRadius: 4,
                    }
                  }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Key Considerations
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {evaluation.overall_considerations_score || 0}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={evaluation.overall_considerations_score || 0} 
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#1E3A54',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getScoreColor(evaluation.overall_considerations_score || 0),
                      borderRadius: 4,
                    }
                  }}
                />
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={downloadCSV}
              disabled={!evaluation.questions || evaluation.questions.length === 0}
              sx={{
                backgroundColor: '#7DE1C3',
                color: '#0A1929',
                '&:hover': { backgroundColor: '#55C4A5' }
              }}
            >
              Download CSV
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Detailed Questions */}
      <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #1E3A54' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #1E3A54' }}>
            <Typography variant="h6" sx={{ color: '#7DE1C3' }}>
              Detailed Evaluation
            </Typography>
          </Box>
          
          {evaluation.questions && evaluation.questions.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: '#1E3A54', color: '#7DE1C3', fontWeight: 'bold' }}>
                      Question
                    </TableCell>
                    <TableCell sx={{ backgroundColor: '#1E3A54', color: '#7DE1C3', fontWeight: 'bold' }}>
                      Answer
                    </TableCell>
                    <TableCell sx={{ backgroundColor: '#1E3A54', color: '#7DE1C3', fontWeight: 'bold' }}>
                      Approach
                    </TableCell>
                    <TableCell sx={{ backgroundColor: '#1E3A54', color: '#7DE1C3', fontWeight: 'bold' }}>
                      Considerations
                    </TableCell>
                    <TableCell sx={{ backgroundColor: '#1E3A54', color: '#7DE1C3', fontWeight: 'bold' }}>
                      Feedback
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {evaluation.questions.map((question, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ verticalAlign: 'top', maxWidth: 200 }}>
                        <Typography variant="body2">{question.question || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'top', maxWidth: 250 }}>
                        <Typography variant="body2">{question.candidate_answer || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'top' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Chip
                            label={question.approach_evaluation || 'N/A'}
                            size="small"
                            sx={{
                              backgroundColor: getScoreColor(question.approach_score || 0),
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Score: {question.approach_score || 0}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'top' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Chip
                            label={question.key_considerations_evaluation || 'N/A'}
                            size="small"
                            sx={{
                              backgroundColor: getScoreColor(question.key_considerations_score || 0),
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Score: {question.key_considerations_score || 0}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'top', maxWidth: 300 }}>
                        <Typography variant="body2">{question.feedback || 'N/A'}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No detailed questions available
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                The evaluation data may not include question-level details
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default EvaluationDetails; 