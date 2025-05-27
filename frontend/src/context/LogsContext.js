import React, { createContext, useContext, useState } from 'react';

const LogsContext = createContext();

export const useLogs = () => useContext(LogsContext);

export const LogsProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const [isEnabled, setIsEnabled] = useState(false);

  const addLog = (message, type = 'info', component = 'App') => {
    if (!isEnabled) return;
    
    const timestamp = new Date().toISOString();
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp,
      message,
      type,
      component,
      time: new Date().toLocaleTimeString()
    };
    
    setLogs(prev => [...prev, newLog]);
    console.log(`[${component}] ${timestamp} [${type.toUpperCase()}]`, message);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const enableLogs = () => {
    setIsEnabled(true);
    addLog('🔍 Logging system enabled', 'info', 'LogsSystem');
  };

  const disableLogs = () => {
    addLog('🔍 Logging system disabled', 'info', 'LogsSystem');
    setIsEnabled(false);
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] [${log.component}] [${log.type.toUpperCase()}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `app-logs-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const value = {
    logs,
    isEnabled,
    addLog,
    clearLogs,
    enableLogs,
    disableLogs,
    exportLogs
  };

  return (
    <LogsContext.Provider value={value}>
      {children}
    </LogsContext.Provider>
  );
}; 