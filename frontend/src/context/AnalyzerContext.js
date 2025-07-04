import React, { createContext, useContext, useState } from 'react';

const AnalyzerContext = createContext();

export const useAnalyzer = () => useContext(AnalyzerContext);

export const AnalyzerProvider = ({ children }) => {
  // Estado global para toda la aplicación
  const [transcript, setTranscript] = useState(null);
  const [transcriptId, setTranscriptId] = useState(null);
  const [qaPairs, setQaPairs] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('L3'); // Default to L3
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [evaluationId, setEvaluationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para reiniciar todos los estados
  const resetAll = () => {
    setTranscript(null);
    setTranscriptId(null);
    setQaPairs([]);
    setCurrentStep(1);
    setSelectedCase(null);
    setSelectedLevel('L3');
    setEvaluationResults(null);
    setEvaluationId(null);
    setError(null);
  };

  // Función para avanzar al siguiente paso
  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  // Función para retroceder al paso anterior
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const value = {
    transcript,
    setTranscript,
    transcriptId,
    setTranscriptId,
    qaPairs,
    setQaPairs,
    currentStep,
    setCurrentStep,
    selectedCase,
    setSelectedCase,
    selectedLevel,
    setSelectedLevel,
    evaluationResults,
    setEvaluationResults,
    evaluationId,
    setEvaluationId,
    loading,
    setLoading,
    error,
    setError,
    resetAll,
    nextStep,
    prevStep
  };

  return (
    <AnalyzerContext.Provider value={value}>
      {children}
    </AnalyzerContext.Provider>
  );
}; 