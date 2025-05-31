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
            Server Diagnostic
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Technical information and system status
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchDiagnosticData}
          disabled={loading}
        >
          Refresh
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
            ? '✅ STATEFUL server running correctly (with real authentication and database)'
            : '⚠️ LEGACY server running (test mode without real authentication)'
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
                <Typography variant="h6">Server Information</Typography>
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
                      Version: {serverInfo.version || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Collapse in={expanded.server}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Features:
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
                <Typography color="error">Could not retrieve server information</Typography>
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
                <Typography variant="h6">System Status</Typography>
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
                        Uptime:
                      </Typography>
                      <Typography variant="body1">
                        {formatUptime(debugStatus.uptime)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Memory:
                      </Typography>
                      <Typography variant="body1">
                        {formatMemory(debugStatus.memory?.rss || 0)}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Collapse in={expanded.system}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Technical details:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Node.js: {debugStatus.node_version}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Environment: {debugStatus.environment}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Timestamp: {new Date(debugStatus.timestamp).toLocaleString()}
                    </Typography>
                  </Collapse>
                </>
              ) : (
                <Typography color="error">Could not retrieve system status</Typography>
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
                <Typography variant="h6">Configuration Status</Typography>
              </Box>
              
              {debugStatus && (
                <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Component</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Database</TableCell>
                        <TableCell>
                          <Chip
                            label={debugStatus.database_url_configured ? 'Configured' : 'Not configured'}
                            color={debugStatus.database_url_configured ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {debugStatus.database_url_configured 
                            ? 'PostgreSQL configured correctly'
                            : 'Missing DATABASE_URL configuration'
                          }
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell>Google OAuth</TableCell>
                        <TableCell>
                          <Chip
                            label={debugStatus.google_oauth_configured ? 'Configured' : 'Not configured'}
                            color={debugStatus.google_oauth_configured ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {debugStatus.google_oauth_configured 
                            ? 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET configured'
                            : 'Missing Google OAuth credentials'
                          }
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell>Security</TableCell>
                        <TableCell>
                          <Chip
                            label={debugStatus.jwt_secret_configured && debugStatus.encryption_key_configured ? 'Configured' : 'Incomplete'}
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
                            label={debugStatus.openaiAvailable ? 'Available' : 'Not available'}
                            color={debugStatus.openaiAvailable ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {debugStatus.openaiAvailable 
                            ? 'OpenAI API configured'
                            : 'Using fallback mode'
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
                  <Typography variant="h6">Recommendations</Typography>
                </Box>
                
                {serverInfo?.server === 'LEGACY_SERVER' && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Legacy Server Detected
                    </Typography>
                    <Typography variant="body2">
                      Your application is running with the legacy server. To use all features:
                    </Typography>
                    <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                      <li>Configure all required environment variables</li>
                      <li>Verify that the Start Command in Render is "npm start"</li>
                      <li>Perform a Manual Deploy to apply changes</li>
                    </Box>
                  </Alert>
                )}
                
                {!debugStatus.google_oauth_configured && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Configure Google OAuth
                    </Typography>
                    <Typography variant="body2">
                      For real authentication, configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Render environment variables.
                    </Typography>
                  </Alert>
                )}
                
                {!debugStatus.database_url_configured && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Database Required
                    </Typography>
                    <Typography variant="body2">
                      Create a PostgreSQL database in Render and configure DATABASE_URL for data persistence.
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