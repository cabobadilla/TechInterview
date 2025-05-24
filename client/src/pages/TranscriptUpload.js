import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Paper, Typography, Button, Box, Alert, 
  CircularProgress, Divider 
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useAnalyzer } from '../context/AnalyzerContext';
import axios from 'axios';

const TranscriptUpload = () => {
  const navigate = useNavigate();
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

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    
    // Vista previa del archivo
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        setPreviewText(text.slice(0, 500) + (text.length > 500 ? '...' : ''));
      };
      reader.readAsText(selectedFile);
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
    <Paper elevation={0} sx={{ p: 4, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Paso 1: Sube el transcript de la entrevista
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Sube un archivo de texto con el transcript de la entrevista en formato A: (pregunta) y C: (respuesta).
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box 
        component="form" 
        onSubmit={handleSubmit} 
        sx={{ mt: 3 }}
      >
        <Button
          component="label"
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          sx={{ mb: 3 }}
          fullWidth
        >
          Seleccionar Archivo
          <input
            type="file"
            accept=".txt"
            hidden
            onChange={handleFileChange}
          />
        </Button>
        
        {file && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Archivo seleccionado: {file.name}
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
              <Typography variant="body2" fontFamily="monospace" whiteSpace="pre-wrap">
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
        >
          {loading ? <CircularProgress size={24} /> : 'Procesar Transcript'}
        </Button>
      </Box>
    </Paper>
  );
};

export default TranscriptUpload; 