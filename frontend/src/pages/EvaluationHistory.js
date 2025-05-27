import React, { useState, useEffect } from 'react';
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
  Divider,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Download,
  Visibility,
  Assessment,
  Schedule,
  Person
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useLogs } from '../context/LogsContext';
import { useNavigate } from 'react-router-dom';

const EvaluationHistory = () => {
  const { api, user } = useAuth();
  const { addLog } = useLogs();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    addLog('=== EVALUATION HISTORY PAGE INITIALIZATION ===', 'info', 'EvaluationHistory');
    addLog(`User: ${user?.email || 'Unknown'}`, 'info', 'EvaluationHistory');
    addLog(`Current page: ${page}`, 'info', 'EvaluationHistory');
    fetchEvaluations();
  }, [page]);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      addLog('🔍 Starting evaluation history fetch...', 'info', 'EvaluationHistory');
      addLog(`📊 Fetching page ${page} with limit 10`, 'info', 'EvaluationHistory');
      
      console.log('🔍 Fetching evaluations from API...');
      const response = await api.get(`/api/evaluations?page=${page}&limit=10`);
      console.log('📊 Evaluations API response:', response.data);
      
      addLog(`✅ API response received: ${response.data.evaluations?.length || 0} evaluations`, 'success', 'EvaluationHistory');
      addLog(`📊 Total evaluations in DB: ${response.data.pagination?.total || 0}`, 'info', 'EvaluationHistory');
      
      setEvaluations(response.data.evaluations || []);
      setTotalPages(Math.ceil((response.data.pagination?.total || 0) / (response.data.pagination?.limit || 10)));
      
      console.log('✅ Evaluations loaded:', response.data.evaluations?.length || 0);
      addLog(`✅ Evaluation history loaded successfully`, 'success', 'EvaluationHistory');
      
      if (response.data.evaluations?.length === 0) {
        addLog('ℹ️ No evaluations found in history', 'info', 'EvaluationHistory');
      }
    } catch (err) {
      console.error('❌ Error fetching evaluations:', err);
      console.error('Error details:', err.response?.data || err.message);
      
      addLog(`❌ Failed to fetch evaluation history: ${err.message}`, 'error', 'EvaluationHistory');
      if (err.response?.status === 401) {
        addLog('🔐 Authentication error - user may need to login again', 'error', 'EvaluationHistory');
      } else if (err.response?.data) {
        addLog(`🔧 Server error: ${JSON.stringify(err.response.data)}`, 'error', 'EvaluationHistory');
      }
      
      setError('Failed to load evaluation history');
    } finally {
      setLoading(false);
      addLog('🏁 Evaluation history fetch completed', 'info', 'EvaluationHistory');
    }
  };

  const handleExpandCard = (evaluationId) => {
    setExpandedCard(expandedCard === evaluationId ? null : evaluationId);
  };

  const handleViewDetails = (evaluationId) => {
    addLog(`🔍 Navigating to evaluation details: ${evaluationId}`, 'info', 'EvaluationHistory');
    console.log('🔍 Navigating to evaluation details:', evaluationId);
    navigate(`/evaluation/${evaluationId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getLevelColor = (level) => {
    const colors = {
      'L3': 'info',
      'L4': 'primary',
      'L5': 'secondary',
      'L6': 'warning'
    };
    return colors[level] || 'default';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#7DE1C3' }}>
          Historial de Evaluaciones
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Consulta todas tus evaluaciones anteriores y revisa tu progreso
        </Typography>
      </Box>

      {/* User Stats */}
      <Card sx={{ mb: 4, backgroundColor: 'background.paper', border: '1px solid #1E3A54' }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Assessment sx={{ fontSize: 40, color: '#7DE1C3', mb: 1 }} />
                <Typography variant="h6" color="primary">
                  {evaluations.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Evaluaciones Totales
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Person sx={{ fontSize: 40, color: '#7DE1C3', mb: 1 }} />
                <Typography variant="h6" color="primary">
                  {user?.name || 'Usuario'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Perfil Activo
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Schedule sx={{ fontSize: 40, color: '#7DE1C3', mb: 1 }} />
                <Typography variant="h6" color="primary">
                  {evaluations.length > 0 ? formatDate(evaluations[0].created_at).split(',')[0] : 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Última Evaluación
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {evaluations.length > 0 
                    ? Math.round(evaluations.reduce((acc, evaluation) => acc + evaluation.overall_score, 0) / evaluations.length)
                    : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Promedio General
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Evaluations List */}
      {evaluations.length === 0 ? (
        <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #1E3A54' }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Assessment sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay evaluaciones disponibles
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Realiza tu primera evaluación para ver el historial aquí
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/upload')}
              sx={{
                backgroundColor: '#7DE1C3',
                color: '#0A1929',
                '&:hover': { backgroundColor: '#55C4A5' }
              }}
            >
              Comenzar Evaluación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {evaluations.map((evaluation) => (
            <Card
              key={evaluation.id}
              sx={{
                mb: 2,
                backgroundColor: 'background.paper',
                border: '1px solid #1E3A54',
                '&:hover': { borderColor: '#7DE1C3' }
              }}
            >
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h6" gutterBottom>
                      {evaluation.case_study_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(evaluation.created_at)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Chip
                      label={evaluation.expected_level}
                      color={getLevelColor(evaluation.expected_level)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Chip
                      label={`${evaluation.overall_score}%`}
                      color={getScoreColor(evaluation.overall_score)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(evaluation.id)}
                        sx={{ color: '#7DE1C3' }}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleExpandCard(evaluation.id)}
                        sx={{ color: '#7DE1C3' }}
                      >
                        {expandedCard === evaluation.id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>

                <Collapse in={expandedCard === evaluation.id}>
                  <Divider sx={{ my: 2, borderColor: '#1E3A54' }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Resumen de Resultados:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Preguntas evaluadas: {evaluation.questions_count || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Tiempo de procesamiento: {evaluation.processing_duration_ms ? `${Math.round(evaluation.processing_duration_ms / 1000)}s` : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Modelo utilizado: {evaluation.openai_model_used || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Acciones:
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => handleViewDetails(evaluation.id)}
                        sx={{ mr: 1, mb: 1 }}
                      >
                        Ver Detalles
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Download />}
                        sx={{ mr: 1, mb: 1 }}
                        disabled
                      >
                        Descargar PDF
                      </Button>
                    </Grid>
                  </Grid>
                </Collapse>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(event, value) => setPage(value)}
                color="primary"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: 'text.primary',
                    '&.Mui-selected': {
                      backgroundColor: '#7DE1C3',
                      color: '#0A1929'
                    }
                  }
                }}
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default EvaluationHistory; 