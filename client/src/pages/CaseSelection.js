import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Paper, Typography, Button, Box, Alert, 
  FormControl, InputLabel, Select, MenuItem, 
  Grid, Card, CardContent, Divider, Chip,
  useTheme, useMediaQuery
} from '@mui/material';
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
        setError('Error loading case studies');
      }
    };
    
    fetchCases();
  }, [qaPairs, navigate, setError]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCase) {
      setError('Please select a case study');
      return;
    }
    
    if (!selectedLevel) {
      setError('Please select an experience level');
      return;
    }
    
    nextStep();
    navigate('/results');
  };
  
  return (
    <Paper elevation={0} sx={{ 
      p: { xs: 3, sm: 4 }, 
      borderRadius: 0, 
      border: '1px solid #E0E0E0',
      mb: 5
    }}>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
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
                    borderRadius: 0,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E0E0E0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#000000',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#000000',
                      borderWidth: 1
                    }
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
                    borderRadius: 0,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E0E0E0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#000000',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#000000',
                      borderWidth: 1
                    }
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
                borderRadius: 0,
                border: '1px solid #E0E0E0',
                boxShadow: 'none'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 400, mb: 2 }}>
                  {cases[selectedCase].name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 3 }}>
                  <strong>Objective:</strong> {cases[selectedCase].objective}
                </Typography>
                
                <Divider sx={{ my: 3, borderColor: '#E0E0E0' }} />
                
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, fontWeight: 400 }}>
                  Expected Process:
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {cases[selectedCase].process_answer.map((process, idx) => (
                    <Chip 
                      key={idx}
                      label={process}
                      variant="outlined"
                      size="small"
                      sx={{ 
                        fontWeight: 400, 
                        borderColor: '#E0E0E0',
                        borderRadius: 1,
                        color: '#000000'
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
                      variant="outlined"
                      size="small"
                      sx={{ 
                        fontWeight: 400, 
                        borderColor: '#E0E0E0',
                        borderRadius: 1,
                        color: '#000000'
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
          
          <Divider sx={{ my: 4, borderColor: '#E0E0E0' }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="text"
              onClick={() => {
                prevStep();
                navigate('/upload');
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
              type="submit"
              variant="outlined"
              disabled={loading || !selectedCase || !selectedLevel}
              sx={{ 
                minWidth: 120,
                borderColor: '#E0E0E0',
                color: '#000000',
                '&:hover': {
                  borderColor: '#000000',
                  backgroundColor: 'transparent'
                },
                py: 1
              }}
            >
              Continue
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default CaseSelection; 