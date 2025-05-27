import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Box } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useLogs } from '../context/LogsContext';

const EvaluationDetailsTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addLog } = useLogs();

  useEffect(() => {
    console.log('EvaluationDetailsTest component mounted');
    console.log('ID from params:', id);
    addLog(`🧪 TEST: EvaluationDetailsTest loaded with ID: ${id}`, 'info', 'EvaluationDetailsTest');
  }, [id, addLog]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
            Evaluation Details Test
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Testing route with ID: {id}
          </Typography>
        </Box>
      </Box>

      <Typography variant="h6" sx={{ color: '#7DE1C3', mb: 2 }}>
        🧪 This is a test page to verify the route is working
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 2 }}>
        Evaluation ID from URL: <strong>{id}</strong>
      </Typography>
      
      <Typography variant="body2" color="text.secondary">
        If you can see this page, the route is working correctly. Check the Logs page for confirmation.
      </Typography>
    </Container>
  );
};

export default EvaluationDetailsTest; 