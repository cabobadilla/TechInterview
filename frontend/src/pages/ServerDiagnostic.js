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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Refresh,
  CheckCircle,
  Error,
  Warning,
  Info,
  ExpandMore,
  ExpandLess,
  Computer,
  Storage,
  Security,
  Cloud
} from '@mui/icons-material';
import axios from 'axios';
import { buildApiUrl } from '../config/api';

const ServerDiagnostic = () => {
  const [serverInfo, setServerInfo] = useState(null);
  const [debugStatus, setDebugStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetchDiagnosticData();
  }, []);

  const fetchDiagnosticData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch server info and debug status
      const [serverResponse, debugResponse] = await Promise.all([
        axios.get(buildApiUrl('/api/server-info')).catch(err => ({ data: { error: err.message } })),
        axios.get(buildApiUrl('/api/debug/status')).catch(err => ({ data: { error: err.message } }))
      ]);
      
      setServerInfo(serverResponse.data);
      setDebugStatus(debugResponse.data);
    } catch (err) {
      setError('Failed to fetch diagnostic data');
      console.error('Diagnostic error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandToggle = (section) => {
    setExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getServerTypeColor = (serverType) => {
    if (serverType === 'STATEFUL_SERVER_NEW') return 'success';
    if (serverType === 'LEGACY_SERVER') return 'warning';
    return 'default';
  };

  const getServerTypeIcon = (serverType) => {
    if (serverType === 'STATEFUL_SERVER_NEW') return <CheckCircle />;
    if (serverType === 'LEGACY_SERVER') return <Warning />;
    return <Error />;
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes) => {
    return `${Math.round(bytes / 1024 / 1024)}MB`;
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#7DE1C3' }}>
            Diagnóstico del Servidor
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Información técnica y estado del sistema
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchDiagnosticData}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Server Type Alert */}
      {serverInfo && (
        <Alert 
          severity={serverInfo.server === 'STATEFUL_SERVER_NEW' ? 'success' : 'warning'} 
          sx={{ mb: 3 }}
          icon={getServerTypeIcon(serverInfo.server)}
        >
          {serverInfo.server === 'STATEFUL_SERVER_NEW' 
            ? '✅ Servidor STATEFUL ejecutándose correctamente (con autenticación real y base de datos)'
            : '⚠️ Servidor LEGACY ejecutándose (modo de prueba sin autenticación real)'
          }
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Server Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #1E3A54' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Computer sx={{ mr: 1, color: '#7DE1C3' }} />
                <Typography variant="h6">Información del Servidor</Typography>
                <IconButton
                  size="small"
                  onClick={() => handleExpandToggle('server')}
                  sx={{ ml: 'auto' }}
                >
                  {expanded.server ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              
              {serverInfo ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={serverInfo.server || 'Unknown'}
                      color={getServerTypeColor(serverInfo.server)}
                      icon={getServerTypeIcon(serverInfo.server)}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Versión: {serverInfo.version || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Collapse in={expanded.server}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Características:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {serverInfo.features?.map((feature, index) => (
                        <Chip
                          key={index}
                          label={feature}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Collapse>
                </>
              ) : (
                <Typography color="error">No se pudo obtener información del servidor</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Status */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #1E3A54' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Info sx={{ mr: 1, color: '#7DE1C3' }} />
                <Typography variant="h6">Estado del Sistema</Typography>
                <IconButton
                  size="small"
                  onClick={() => handleExpandToggle('system')}
                  sx={{ ml: 'auto' }}
                >
                  {expanded.system ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              
              {debugStatus ? (
                <>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Tiempo activo:
                      </Typography>
                      <Typography variant="body1">
                        {formatUptime(debugStatus.uptime)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Memoria:
                      </Typography>
                      <Typography variant="body1">
                        {formatMemory(debugStatus.memory?.rss || 0)}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Collapse in={expanded.system}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Detalles técnicos:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Node.js: {debugStatus.node_version}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Entorno: {debugStatus.environment}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Timestamp: {new Date(debugStatus.timestamp).toLocaleString()}
                    </Typography>
                  </Collapse>
                </>
              ) : (
                <Typography color="error">No se pudo obtener estado del sistema</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Configuration Status */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #1E3A54' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security sx={{ mr: 1, color: '#7DE1C3' }} />
                <Typography variant="h6">Estado de Configuración</Typography>
              </Box>
              
              {debugStatus && (
                <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Componente</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Descripción</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Base de Datos</TableCell>
                        <TableCell>
                          <Chip
                            label={debugStatus.database_url_configured ? 'Configurada' : 'No configurada'}
                            color={debugStatus.database_url_configured ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {debugStatus.database_url_configured 
                            ? 'PostgreSQL configurado correctamente'
                            : 'Falta configurar DATABASE_URL'
                          }
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell>Google OAuth</TableCell>
                        <TableCell>
                          <Chip
                            label={debugStatus.google_oauth_configured ? 'Configurado' : 'No configurado'}
                            color={debugStatus.google_oauth_configured ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {debugStatus.google_oauth_configured 
                            ? 'GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET configurados'
                            : 'Faltan credenciales de Google OAuth'
                          }
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell>Seguridad</TableCell>
                        <TableCell>
                          <Chip
                            label={debugStatus.jwt_secret_configured && debugStatus.encryption_key_configured ? 'Configurada' : 'Incompleta'}
                            color={debugStatus.jwt_secret_configured && debugStatus.encryption_key_configured ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          JWT Secret: {debugStatus.jwt_secret_configured ? '✅' : '❌'} | 
                          Encryption Key: {debugStatus.encryption_key_configured ? '✅' : '❌'}
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell>OpenAI</TableCell>
                        <TableCell>
                          <Chip
                            label={debugStatus.openaiAvailable ? 'Disponible' : 'No disponible'}
                            color={debugStatus.openaiAvailable ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {debugStatus.openaiAvailable 
                            ? 'API de OpenAI configurada'
                            : 'Usando modo fallback'
                          }
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recommendations */}
        {debugStatus && (
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #1E3A54' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Cloud sx={{ mr: 1, color: '#7DE1C3' }} />
                  <Typography variant="h6">Recomendaciones</Typography>
                </Box>
                
                {serverInfo?.server === 'LEGACY_SERVER' && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Servidor Legacy Detectado
                    </Typography>
                    <Typography variant="body2">
                      Tu aplicación está ejecutándose con el servidor legacy. Para usar todas las funcionalidades:
                    </Typography>
                    <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                      <li>Configura todas las variables de entorno requeridas</li>
                      <li>Verifica que el Start Command en Render sea "npm start"</li>
                      <li>Haz un Manual Deploy para aplicar cambios</li>
                    </Box>
                  </Alert>
                )}
                
                {!debugStatus.google_oauth_configured && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Configurar Google OAuth
                    </Typography>
                    <Typography variant="body2">
                      Para autenticación real, configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en las variables de entorno de Render.
                    </Typography>
                  </Alert>
                )}
                
                {!debugStatus.database_url_configured && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Base de Datos Requerida
                    </Typography>
                    <Typography variant="body2">
                      Crea una base de datos PostgreSQL en Render y configura DATABASE_URL para persistencia de datos.
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default ServerDiagnostic; 