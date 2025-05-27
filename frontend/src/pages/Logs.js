import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Grid
} from '@mui/material';
import {
  Download,
  Clear,
  Refresh,
  FilterList,
  BugReport,
  Info,
  Warning,
  Error as ErrorIcon,
  CheckCircle
} from '@mui/icons-material';
import { useLogs } from '../context/LogsContext';

const Logs = () => {
  const { 
    logs, 
    isEnabled, 
    enableLogs, 
    disableLogs, 
    clearLogs, 
    exportLogs 
  } = useLogs();
  
  const [filter, setFilter] = useState('all');
  const [componentFilter, setComponentFilter] = useState('all');

  const getLogIcon = (type) => {
    switch (type) {
      case 'error': return <ErrorIcon sx={{ color: '#ff6b6b', fontSize: 16 }} />;
      case 'warning': return <Warning sx={{ color: '#ffa726', fontSize: 16 }} />;
      case 'success': return <CheckCircle sx={{ color: '#7DE1C3', fontSize: 16 }} />;
      case 'info': 
      default: return <Info sx={{ color: '#64b5f6', fontSize: 16 }} />;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return '#ff6b6b';
      case 'warning': return '#ffa726';
      case 'success': return '#7DE1C3';
      case 'info': 
      default: return '#64b5f6';
    }
  };

  const filteredLogs = logs.filter(log => {
    const typeMatch = filter === 'all' || log.type === filter;
    const componentMatch = componentFilter === 'all' || log.component === componentFilter;
    return typeMatch && componentMatch;
  });

  const logCounts = {
    total: logs.length,
    error: logs.filter(log => log.type === 'error').length,
    warning: logs.filter(log => log.type === 'warning').length,
    success: logs.filter(log => log.type === 'success').length,
    info: logs.filter(log => log.type === 'info').length
  };

  const components = [...new Set(logs.map(log => log.component))];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#7DE1C3' }}>
            <BugReport sx={{ mr: 1, verticalAlign: 'middle' }} />
            Logs del Sistema
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitoreo en tiempo real de la aplicación
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={isEnabled}
                onChange={(e) => e.target.checked ? enableLogs() : disableLogs()}
                color="primary"
              />
            }
            label="Habilitar Logs"
          />
          
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={clearLogs}
            disabled={logs.length === 0}
          >
            Limpiar
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={exportLogs}
            disabled={logs.length === 0}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* Status Alert */}
      {!isEnabled && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Los logs están deshabilitados. Activa el switch "Habilitar Logs" para comenzar a capturar información de debug.
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #1E3A54' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: '#7DE1C3', fontWeight: 'bold' }}>
                {logCounts.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #ff6b6b' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: '#ff6b6b', fontWeight: 'bold' }}>
                {logCounts.error}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Errores
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #ffa726' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: '#ffa726', fontWeight: 'bold' }}>
                {logCounts.warning}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Advertencias
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #7DE1C3' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: '#7DE1C3', fontWeight: 'bold' }}>
                {logCounts.success}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Éxitos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #64b5f6' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
                {logCounts.info}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Info
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #1E3A54', mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FilterList sx={{ color: '#7DE1C3' }} />
            <Typography variant="h6" sx={{ color: '#7DE1C3' }}>
              Filtros
            </Typography>
            
            <TextField
              select
              label="Tipo"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="error">Errores</MenuItem>
              <MenuItem value="warning">Advertencias</MenuItem>
              <MenuItem value="success">Éxitos</MenuItem>
              <MenuItem value="info">Info</MenuItem>
            </TextField>
            
            <TextField
              select
              label="Componente"
              value={componentFilter}
              onChange={(e) => setComponentFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">Todos</MenuItem>
              {components.map(component => (
                <MenuItem key={component} value={component}>
                  {component}
                </MenuItem>
              ))}
            </TextField>
            
            <Chip 
              label={`${filteredLogs.length} logs mostrados`}
              color="primary"
              size="small"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card sx={{ backgroundColor: 'background.paper', border: '1px solid #1E3A54' }}>
        <CardContent sx={{ p: 0 }}>
          {filteredLogs.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                {logs.length === 0 ? 'No hay logs disponibles' : 'No hay logs que coincidan con los filtros'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {!isEnabled 
                  ? 'Habilita los logs para comenzar a capturar información'
                  : 'Interactúa con la aplicación para generar logs'
                }
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: '#1E3A54', color: '#7DE1C3', fontWeight: 'bold' }}>
                      Tiempo
                    </TableCell>
                    <TableCell sx={{ backgroundColor: '#1E3A54', color: '#7DE1C3', fontWeight: 'bold' }}>
                      Tipo
                    </TableCell>
                    <TableCell sx={{ backgroundColor: '#1E3A54', color: '#7DE1C3', fontWeight: 'bold' }}>
                      Componente
                    </TableCell>
                    <TableCell sx={{ backgroundColor: '#1E3A54', color: '#7DE1C3', fontWeight: 'bold' }}>
                      Mensaje
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogs.slice().reverse().map((log) => (
                    <TableRow 
                      key={log.id}
                      sx={{ 
                        '&:hover': { backgroundColor: 'rgba(125, 225, 195, 0.05)' },
                        borderLeft: `3px solid ${getLogColor(log.type)}`
                      }}
                    >
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', minWidth: 100 }}>
                        {log.time}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getLogIcon(log.type)}
                          <Chip
                            label={log.type.toUpperCase()}
                            size="small"
                            sx={{
                              backgroundColor: getLogColor(log.type),
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.component}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-word' }}>
                        {log.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Logs; 