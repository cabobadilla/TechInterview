import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Paper, Typography, Button, Box, Alert, 
  CircularProgress, Divider, useTheme, useMediaQuery
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import { useAnalyzer } from '../context/AnalyzerContext';
import { useAuth } from '../context/AuthContext';

const TranscriptUpload = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { 
    setTranscript, 
    setQaPairs, 
    nextStep, 
    loading, 
    setLoading, 
    error, 
    setError 
  } = useAnalyzer();
  
  const { api } = useAuth();
  
  const [file, setFile] = useState(null);
  const [previewText, setPreviewText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);
  const [uploadStartTime, setUploadStartTime] = useState(null);
  const [realTimeTimer, setRealTimeTimer] = useState(0);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Real-time timer for debugging
  React.useEffect(() => {
    let interval;
    if (loading && uploadStartTime) {
      interval = setInterval(() => {
        setRealTimeTimer(Math.round((Date.now() - uploadStartTime) / 1000));
      }, 1000);
    } else {
      setRealTimeTimer(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading, uploadStartTime]);

  const addDebugInfo = (message) => {
    const timestamp = new Date().toISOString();
    const info = `[${timestamp}] ${message}`;
    console.log('CLIENT DEBUG:', info);
    setDebugInfo(prev => [...prev, info]);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    processFile(selectedFile);
  };
  
  const processFile = (selectedFile) => {
    if (!selectedFile) return;
    
    setFile(selectedFile);
    
    // File preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setPreviewText(text.slice(0, 500) + (text.length > 500 ? '...' : ''));
    };
    reader.readAsText(selectedFile);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a transcript file');
      return;
    }
    
    setLoading(true);
    setError(null);
    setDebugInfo([]);
    setUploadStartTime(Date.now());
    
    addDebugInfo('Starting transcript upload process');
    addDebugInfo(`File: ${file.name}, Size: ${file.size} bytes`);
    
    const formData = new FormData();
    formData.append('transcript', file);
    
    try {
      addDebugInfo('FormData created, making API call...');
      
      // Add timeout to the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        addDebugInfo('REQUEST TIMEOUT - Aborting after 120 seconds');
      }, 120000); // 2 minutes timeout
      
      addDebugInfo('API call initiated with timeout protection');
      
      const response = await api.post('/api/transcript', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        signal: controller.signal,
        timeout: 120000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          addDebugInfo(`Upload progress: ${percentCompleted}%`);
        }
      });
      
      clearTimeout(timeoutId);
      const duration = Date.now() - uploadStartTime;
      addDebugInfo(`API call completed successfully in ${duration}ms`);
      
      addDebugInfo('Extracting data from response...');
      const { transcript, qa_pairs } = response.data;
      
      addDebugInfo(`Response validation - Response exists: ${!!response.data}`);
      addDebugInfo(`Response validation - Transcript exists: ${!!transcript}`);
      addDebugInfo(`Response validation - QA pairs exists: ${!!qa_pairs}`);
      addDebugInfo(`Response received - Transcript length: ${transcript?.length || 0}, QA pairs: ${qa_pairs?.length || 0}`);
      
      if (!qa_pairs || qa_pairs.length === 0) {
        addDebugInfo('ERROR: No QA pairs found in response');
        throw new Error('Unable to extract questions and answers from the transcript');
      }
      
      addDebugInfo('QA pairs validation passed');
      addDebugInfo('Setting transcript in context...');
      
      // Emergency mode - bypass context and navigation
      if (emergencyMode) {
        addDebugInfo('EMERGENCY MODE: Skipping context and navigation');
        setSuccessData({ transcript, qa_pairs });
        addDebugInfo('EMERGENCY MODE: Success data set, process complete');
        return;
      }
      
      // Use try-catch for context operations
      try {
        setTranscript(transcript);
        addDebugInfo('Transcript set successfully');
        
        setQaPairs(qa_pairs);
        addDebugInfo('QA pairs set successfully');
        
        addDebugInfo('Advancing to next step...');
        nextStep();
        addDebugInfo('Step advanced successfully');
        
        addDebugInfo('Navigating to case selection...');
        navigate('/select-case');
        addDebugInfo('Navigation completed successfully');
      } catch (contextError) {
        addDebugInfo(`Context/Navigation error: ${contextError.message}`);
        throw contextError;
      }
    } catch (error) {
      const duration = Date.now() - uploadStartTime;
      addDebugInfo(`ERROR occurred after ${duration}ms`);
      
      console.error('Error uploading transcript:', error);
      addDebugInfo(`Error type: ${error.name}`);
      addDebugInfo(`Error message: ${error.message}`);
      
      if (error.name === 'AbortError') {
        addDebugInfo('Request was aborted due to timeout');
        setError('Request timed out. The server may be overloaded. Please try again.');
      } else if (error.response?.status === 401) {
        addDebugInfo('Authentication error');
        setError('Authentication required. Please login again.');
      } else if (error.code === 'ECONNABORTED') {
        addDebugInfo('Connection timeout');
        setError('Connection timeout. Please check your internet connection and try again.');
      } else {
        addDebugInfo(`Server error: ${error.response?.data?.error || error.message}`);
        setError(error.response?.data?.error || 'Failed to upload transcript');
      }
    } finally {
      addDebugInfo('Entering finally block...');
      setLoading(false);
      addDebugInfo('Loading set to false');
      const totalDuration = Date.now() - uploadStartTime;
      addDebugInfo(`Process completed in ${totalDuration}ms`);
      addDebugInfo('=== CLIENT PROCESS COMPLETE ===');
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
          Upload Interview Transcript
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary" 
          paragraph 
          sx={{ mb: 4, maxWidth: 560 }}
        >
          Upload a text file with the interview transcript in A: (question) and C: (answer) format.
        </Typography>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 4 }}
          >
            {error}
          </Alert>
        )}
        
        <Box 
          component="form" 
          onSubmit={handleSubmit} 
          sx={{ mt: 3 }}
        >
          <Box
            sx={{
              border: `1px solid ${isDragOver ? '#7DE1C3' : '#1E3A54'}`,
              borderRadius: 0,
              p: 4,
              textAlign: 'center',
              backgroundColor: 'rgba(125, 225, 195, 0.05)',
              transition: 'all 0.2s ease',
              mb: 4,
              cursor: 'pointer'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('transcript-upload').click()}
          >
            <input
              id="transcript-upload"
              type="file"
              accept=".txt"
              hidden
              onChange={handleFileChange}
            />
            
            <FileUploadIcon 
              sx={{ 
                fontSize: 36, 
                color: isDragOver ? '#7DE1C3' : theme.palette.text.secondary,
                mb: 2
              }} 
            />
            
            <Typography variant="h6" gutterBottom color={isDragOver ? "primary" : "text.secondary"} sx={{ fontWeight: 400 }}>
              {file ? 'Change file' : 'Drag your file here'}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              or click to select a file (.txt)
            </Typography>
          </Box>
          
          {file && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                mb: 2
              }}>
                <DescriptionIcon sx={{ color: '#7DE1C3' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                  {(file.size / 1024).toFixed(1)} KB
                </Typography>
              </Box>
              
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 3, 
                  maxHeight: 200, 
                  overflow: 'auto',
                  borderColor: '#1E3A54',
                  borderRadius: 0,
                }}
              >
                <Typography variant="body2" fontFamily="monospace" whiteSpace="pre-wrap" color="text.secondary">
                  {previewText}
                </Typography>
              </Paper>
            </Box>
          )}
          
          <Divider sx={{ my: 4, borderColor: '#1E3A54' }} />
          
          {(loading || debugInfo.length > 0) && (
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
                {loading ? 'Processing...' : 'Debug Information'}
              </Typography>
              
              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CircularProgress size={16} sx={{ mr: 1, color: '#7DE1C3' }} />
                  <Typography variant="body2" color="text.secondary">
                    Processing transcript... This may take up to 2 minutes.
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
                      color: info.includes('ERROR') ? '#ff6b6b' : 
                             info.includes('SUCCESS') || info.includes('completed') ? '#7DE1C3' : 
                             'text.secondary',
                      mb: 0.5
                    }}
                  >
                    {info}
                  </Typography>
                ))}
              </Box>
              
              {loading && uploadStartTime && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Elapsed time: {realTimeTimer}s
                </Typography>
              )}
            </Paper>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                onClick={() => setEmergencyMode(!emergencyMode)}
                variant="outlined"
                size="small"
                sx={{ 
                  color: emergencyMode ? '#ff6b6b' : '#7DE1C3',
                  borderColor: emergencyMode ? '#ff6b6b' : '#7DE1C3'
                }}
              >
                {emergencyMode ? 'Disable' : 'Enable'} Emergency Mode
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !file}
                sx={{ 
                  minWidth: 180,
                  py: 1
                }}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                ) : (
                  'Process Transcript'
                )}
              </Button>
            </Box>
          </Box>
          
          {/* Emergency mode success display */}
          {successData && emergencyMode && (
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 3, 
                mt: 4,
                borderColor: '#7DE1C3',
                borderRadius: 0,
                backgroundColor: 'rgba(125, 225, 195, 0.1)'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: '#7DE1C3', fontWeight: 400 }}>
                🎉 Success (Emergency Mode)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Transcript processed successfully! Data extracted:
              </Typography>
              <Box sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                <Typography>Transcript length: {successData.transcript?.length || 0} characters</Typography>
                <Typography>Questions extracted: {successData.qa_pairs?.length || 0}</Typography>
                {successData.qa_pairs?.map((pair, index) => (
                  <Box key={index} sx={{ mt: 1, p: 1, backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <Typography variant="caption" sx={{ color: '#7DE1C3' }}>Q{index + 1}:</Typography>
                    <Typography variant="caption" component="div">
                      {pair.question?.substring(0, 100)}...
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default TranscriptUpload; 