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
import { useLogs } from '../context/LogsContext';

const TranscriptUpload = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { 
    setTranscript, 
    setTranscriptId,
    setQaPairs, 
    nextStep, 
    loading, 
    setLoading, 
    error, 
    setError 
  } = useAnalyzer();
  
  const { api } = useAuth();
  const { addLog } = useLogs();
  
  const [file, setFile] = useState(null);
  const [previewText, setPreviewText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

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
    const uploadStartTime = Date.now();
    
    addLog('Starting transcript upload process', 'info', 'TranscriptUpload');
    addLog(`File: ${file.name}, Size: ${file.size} bytes`, 'info', 'TranscriptUpload');
    
    const formData = new FormData();
    formData.append('transcript', file);
    
    try {
      addLog('FormData created, making API call...', 'info', 'TranscriptUpload');
      
      // Add timeout to the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        addLog('REQUEST TIMEOUT - Aborting after 120 seconds', 'error', 'TranscriptUpload');
      }, 120000); // 2 minutes timeout
      
      addLog('API call initiated with timeout protection', 'info', 'TranscriptUpload');
      
      const response = await api.post('/api/transcript', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        signal: controller.signal,
        timeout: 120000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          addLog(`Upload progress: ${percentCompleted}%`, 'info', 'TranscriptUpload');
        }
      });
      
      clearTimeout(timeoutId);
      const duration = Date.now() - uploadStartTime;
      addLog(`API call completed successfully in ${duration}ms`, 'success', 'TranscriptUpload');
      
      addLog('Extracting data from response...', 'info', 'TranscriptUpload');
      const { transcript, qa_pairs, transcript_id } = response.data;
      
      addLog(`Response received - Transcript length: ${transcript?.length || 0}, QA pairs: ${qa_pairs?.length || 0}, ID: ${transcript_id || 'Not set'}`, 'info', 'TranscriptUpload');
      
      if (!qa_pairs || qa_pairs.length === 0) {
        addLog('ERROR: No QA pairs found in response', 'error', 'TranscriptUpload');
        throw new Error('Unable to extract questions and answers from the transcript');
      }
      
      addLog('QA pairs validation passed', 'success', 'TranscriptUpload');
      addLog('Setting transcript in context...', 'info', 'TranscriptUpload');
      
      // Use try-catch for context operations
      try {
        setTranscript(transcript);
        addLog('Transcript set successfully', 'success', 'TranscriptUpload');
        
        setTranscriptId(transcript_id);
        addLog(`Transcript ID set successfully: ${transcript_id}`, 'success', 'TranscriptUpload');
        
        setQaPairs(qa_pairs);
        addLog('QA pairs set successfully', 'success', 'TranscriptUpload');
        
        addLog('Advancing to next step...', 'info', 'TranscriptUpload');
        nextStep();
        addLog('Step advanced successfully', 'success', 'TranscriptUpload');
        
        addLog('Navigating to case selection...', 'info', 'TranscriptUpload');
        navigate('/select-case');
        addLog('Navigation completed successfully', 'success', 'TranscriptUpload');
      } catch (contextError) {
        addLog(`Context/Navigation error: ${contextError.message}`, 'error', 'TranscriptUpload');
        throw contextError;
      }
    } catch (error) {
      const duration = Date.now() - uploadStartTime;
      addLog(`ERROR occurred after ${duration}ms`, 'error', 'TranscriptUpload');
      
      console.error('Error uploading transcript:', error);
      addLog(`Error: ${error.message}`, 'error', 'TranscriptUpload');
      
      if (error.name === 'AbortError') {
        addLog('Request was aborted due to timeout', 'error', 'TranscriptUpload');
        setError('Request timed out. The server may be overloaded. Please try again.');
      } else if (error.response?.status === 401) {
        addLog('Authentication error', 'error', 'TranscriptUpload');
        setError('Authentication required. Please login again.');
      } else if (error.code === 'ECONNABORTED') {
        addLog('Connection timeout', 'error', 'TranscriptUpload');
        setError('Connection timeout. Please check your internet connection and try again.');
      } else {
        addLog(`Server error: ${error.response?.data?.error || error.message}`, 'error', 'TranscriptUpload');
        setError(error.response?.data?.error || 'Failed to upload transcript');
      }
    } finally {
      setLoading(false);
      const totalDuration = Date.now() - uploadStartTime;
      addLog(`Process completed in ${totalDuration}ms`, 'info', 'TranscriptUpload');
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
          
          {loading && (
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
                Processing...
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CircularProgress size={16} sx={{ mr: 1, color: '#7DE1C3' }} />
                <Typography variant="body2" color="text.secondary">
                  Processing transcript... This may take up to 2 minutes.
                </Typography>
              </Box>
            </Paper>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
      </Box>
    </Paper>
  );
};

export default TranscriptUpload; 