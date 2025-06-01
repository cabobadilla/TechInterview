import React, { useState, useEffect } from 'react';
import { 
  Paper, Typography, Box, Chip, Accordion, AccordionSummary, 
  AccordionDetails, Alert, CircularProgress, Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BusinessIcon from '@mui/icons-material/Business';
import CloudIcon from '@mui/icons-material/Cloud';
import DataObjectIcon from '@mui/icons-material/DataObject';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import StorageIcon from '@mui/icons-material/Storage';
import BuildIcon from '@mui/icons-material/Build';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HubIcon from '@mui/icons-material/Hub';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useAuth } from '../context/AuthContext';
import { useLogs } from '../context/LogsContext';

const CaseStudiesPreview = () => {
  const [caseStudies, setCaseStudies] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { api } = useAuth();
  const { addLog } = useLogs();

  // Icon mapping for different case study types
  const getTypeIcon = (type) => {
    const iconMap = {
      'Cloud Migration': <CloudIcon />,
      'IT Optimization': <BusinessIcon />,
      'Data Governance': <StorageIcon />,
      'Enterprise Architecture': <ArchitectureIcon />,
      'Data Architecture': <DataObjectIcon />,
      'DevOps / IaC': <BuildIcon />,
      'Microservices Architecture': <AccountTreeIcon />,
      'Domain-Driven Architecture': <HubIcon />
    };
    return iconMap[type] || <BusinessIcon />;
  };

  // Color mapping for different case study types
  const getTypeColor = (type) => {
    const colorMap = {
      'Cloud Migration': '#2196F3',
      'IT Optimization': '#4CAF50',
      'Data Governance': '#FF9800',
      'Enterprise Architecture': '#9C27B0',
      'Data Architecture': '#00BCD4',
      'DevOps / IaC': '#FF5722',
      'Microservices Architecture': '#3F51B5',
      'Domain-Driven Architecture': '#E91E63'
    };
    return colorMap[type] || '#757575';
  };

  useEffect(() => {
    const fetchCaseStudies = async () => {
      try {
        addLog('📚 Fetching case studies from database...', 'info', 'CaseStudiesPreview');
        
        const response = await api.get('/api/case-studies');
        setCaseStudies(response.data);
        
        const count = Object.keys(response.data).length;
        addLog(`✅ Successfully loaded ${count} case studies`, 'success', 'CaseStudiesPreview');
        
        if (count === 0) {
          setError('No case studies available in the database. Please contact support.');
        }
      } catch (error) {
        console.error('Error fetching case studies:', error);
        
        let errorMessage = 'Unable to load case studies from the database.';
        
        if (error.response?.status === 401) {
          errorMessage = 'Authentication required to load case studies. Please log in.';
        } else if (error.response?.status === 500) {
          errorMessage = 'Server error while loading case studies. Please try again later.';
        } else if (error.code === 'NETWORK_ERROR' || !error.response) {
          errorMessage = 'Network error: Cannot connect to the server. Please check your internet connection.';
        }
        
        addLog(`❌ Error fetching case studies: ${errorMessage}`, 'error', 'CaseStudiesPreview');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseStudies();
  }, [api, addLog]);

  if (loading) {
    return (
      <Paper elevation={0} sx={{ 
        p: 3, 
        borderRadius: 0, 
        border: '1px solid #1E3A54',
        mb: 4
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} sx={{ mr: 2, color: '#7DE1C3' }} />
          <Typography variant="body2" color="text.secondary">
            Loading available case studies from database...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={0} sx={{ 
        p: 3, 
        borderRadius: 0, 
        border: '1px solid #f44336',
        mb: 4,
        backgroundColor: 'rgba(244, 67, 54, 0.02)'
      }}>
        <Alert 
          severity="error" 
          icon={<ErrorOutlineIcon />}
          sx={{ 
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
            Case Studies Unavailable
          </Typography>
          <Typography variant="body2" paragraph>
            {error}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The system analyzes interviews based on predefined case studies. 
            Without access to these case studies, the analysis cannot proceed.
          </Typography>
        </Alert>
      </Paper>
    );
  }

  const caseStudiesArray = Object.entries(caseStudies);

  if (caseStudiesArray.length === 0) {
    return (
      <Paper elevation={0} sx={{ 
        p: 3, 
        borderRadius: 0, 
        border: '1px solid #ff9800',
        mb: 4,
        backgroundColor: 'rgba(255, 152, 0, 0.02)'
      }}>
        <Alert 
          severity="warning"
          sx={{ 
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
            No Case Studies Available
          </Typography>
          <Typography variant="body2">
            The case studies database appears to be empty. Please contact support to resolve this issue.
          </Typography>
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ 
      p: { xs: 3, sm: 4 }, 
      borderRadius: 0, 
      border: '1px solid #1E3A54',
      mb: 4,
      backgroundColor: 'rgba(125, 225, 195, 0.02)'
    }}>
      <Typography 
        variant="h5" 
        gutterBottom 
        sx={{ 
          fontWeight: 400, 
          mb: 3,
          color: '#1E3A54',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <BusinessIcon sx={{ color: '#7DE1C3' }} />
        Available Case Studies ({caseStudiesArray.length})
      </Typography>
      
      <Typography 
        variant="body2" 
        color="text.secondary" 
        paragraph 
        sx={{ mb: 3 }}
      >
        These are the case studies our system can analyze. Make sure your interview covers one of these topics for optimal results.
      </Typography>

      <Grid container spacing={2}>
        {caseStudiesArray.map(([key, caseStudy]) => (
          <Grid item xs={12} md={6} key={key}>
            <Accordion 
              elevation={0}
              sx={{ 
                border: '1px solid #E0E0E0',
                borderRadius: '4px !important',
                '&:before': { display: 'none' },
                mb: 1
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  '& .MuiAccordionSummary-content': { 
                    alignItems: 'center',
                    gap: 2
                  }
                }}
              >
                <Box sx={{ 
                  color: getTypeColor(caseStudy.type),
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {getTypeIcon(caseStudy.type)}
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                    {caseStudy.name}
                  </Typography>
                  <Chip 
                    label={caseStudy.type} 
                    size="small" 
                    sx={{ 
                      mt: 0.5,
                      backgroundColor: getTypeColor(caseStudy.type),
                      color: 'white',
                      fontSize: '0.7rem',
                      height: 20
                    }} 
                  />
                </Box>
              </AccordionSummary>
              
              <AccordionDetails sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Objective:</strong> {caseStudy.objective}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Key Areas Covered:</strong>
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Process Steps:
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {caseStudy.process_answer?.slice(0, 3).map((step, index) => (
                      <Chip 
                        key={index}
                        label={step} 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          mr: 1, 
                          mb: 1, 
                          fontSize: '0.7rem',
                          height: 24
                        }} 
                      />
                    ))}
                    {caseStudy.process_answer?.length > 3 && (
                      <Chip 
                        label={`+${caseStudy.process_answer.length - 3} more`} 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          mr: 1, 
                          mb: 1, 
                          fontSize: '0.7rem',
                          height: 24,
                          color: 'text.secondary'
                        }} 
                      />
                    )}
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Key Considerations:
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {caseStudy.key_considerations_answer?.slice(0, 3).map((consideration, index) => (
                      <Chip 
                        key={index}
                        label={consideration} 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          mr: 1, 
                          mb: 1, 
                          fontSize: '0.7rem',
                          height: 24,
                          borderColor: '#7DE1C3',
                          color: '#1E3A54'
                        }} 
                      />
                    ))}
                    {caseStudy.key_considerations_answer?.length > 3 && (
                      <Chip 
                        label={`+${caseStudy.key_considerations_answer.length - 3} more`} 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          mr: 1, 
                          mb: 1, 
                          fontSize: '0.7rem',
                          height: 24,
                          color: 'text.secondary'
                        }} 
                      />
                    )}
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>
      
      <Alert 
        severity="info" 
        sx={{ 
          mt: 3,
          backgroundColor: 'rgba(125, 225, 195, 0.1)',
          borderColor: '#7DE1C3',
          '& .MuiAlert-icon': {
            color: '#7DE1C3'
          }
        }}
      >
        <Typography variant="body2">
          <strong>Tip:</strong> For best results, ensure your interview transcript discusses one of these case studies in detail. 
          The system will analyze how well the candidate's responses align with the expected approach and considerations.
        </Typography>
      </Alert>
    </Paper>
  );
};

export default CaseStudiesPreview; 