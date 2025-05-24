import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Paper, Typography, Button, Box, Alert, 
  CircularProgress, Divider, useTheme, useMediaQuery
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import { useAnalyzer } from '../context/AnalyzerContext';
import axios from 'axios';

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
    
    // Vista previa del archivo
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
      setError('Por favor selecciona un archivo de transcript');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('transcript', file);
    
    try {
      const response = await axios.post('/api/transcript', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const { transcript, qa_pairs } = response.data;
      
      if (!qa_pairs || qa_pairs.length === 0) {
        throw new Error('No se pudieron extraer preguntas y respuestas del transcript');
      }
      
      setTranscript(transcript);
      setQaPairs(qa_pairs);
      nextStep();
      navigate('/case-selection');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al procesar el transcript');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ 
      p: { xs: 2.5, md: 4 }, 
      borderRadius: 2, 
      border: '1px solid #E8EAED' 
    }}>
      <Typography variant="h4" gutterBottom fontWeight={500} color="text.primary">
        Paso 1: Sube el transcript de la entrevista
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
        Sube un archivo de texto con el transcript de la entrevista en formato A: (pregunta) y C: (respuesta).
      </Typography>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
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
            border: `2px dashed ${isDragOver ? theme.palette.primary.main : '#E8EAED'}`,
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            backgroundColor: isDragOver ? 'rgba(66, 133, 244, 0.04)' : '#FAFAFA',
            transition: 'all 0.2s ease',
            mb: 3,
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
              fontSize: 48, 
              color: isDragOver ? theme.palette.primary.main : theme.palette.grey[400],
              mb: 2
            }} 
          />
          
          <Typography variant="h6" gutterBottom color={isDragOver ? "primary" : "text.primary"}>
            {file ? 'Cambiar archivo' : 'Arrastra tu archivo aquí'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            o haz clic para seleccionar un archivo (.txt)
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
              <DescriptionIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={500}>
                {file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                {(file.size / 1024).toFixed(1)} KB
              </Typography>
            </Box>
            
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2.5, 
                bgcolor: '#FAFAFA', 
                maxHeight: 200, 
                overflow: 'auto',
                borderColor: '#E8EAED',
                borderRadius: 2,
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <Typography variant="body2" fontFamily="monospace" whiteSpace="pre-wrap" color="text.secondary">
                {previewText}
              </Typography>
            </Paper>
          </Box>
        )}
        
        <Divider sx={{ my: 3 }} />
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={loading || !file}
          fullWidth
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
          sx={{ py: 1.5 }}
        >
          {loading ? 'Procesando...' : 'Procesar Transcript'}
        </Button>
      </Box>
    </Paper>
  );
};

export default TranscriptUpload; 