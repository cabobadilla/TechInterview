import React from 'react';
import { Stepper as MuiStepper, Step, StepLabel, Paper } from '@mui/material';

const steps = [
  'Subir Transcript',
  'Seleccionar Caso',
  'Ver Resultados'
];

const Stepper = ({ activeStep }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
      <MuiStepper activeStep={activeStep - 1} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </MuiStepper>
    </Paper>
  );
};

export default Stepper; 