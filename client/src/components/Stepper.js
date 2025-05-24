import React from 'react';
import { 
  Stepper as MuiStepper, 
  Step, 
  StepLabel, 
  Paper, 
  styled,
  StepConnector,
  stepConnectorClasses,
  Typography
} from '@mui/material';

const steps = [
  'Upload Transcript',
  'Select Case Study',
  'View Results'
];

// Conector personalizado con estilo minimalista
const MinimalConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#000000',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#000000',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: '#E0E0E0',
    borderTopWidth: 1,
    borderRadius: 0,
  },
}));

// Icono personalizado para los pasos del stepper
const StepIconRoot = styled('div')(({ theme, ownerState }) => ({
  display: 'flex',
  height: 22,
  alignItems: 'center',
  color: '#E0E0E0',
  zIndex: 1,
  ...(ownerState.active && {
    color: '#000000',
  }),
  ...(ownerState.completed && {
    color: '#000000',
  }),
  '& .StepIcon-circle': {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: 'currentColor',
  },
}));

const StepIcon = (props) => {
  const { active, completed, className } = props;

  return (
    <StepIconRoot ownerState={{ active, completed }} className={className}>
      <div className="StepIcon-circle" />
    </StepIconRoot>
  );
};

const StepLabelStyled = styled(StepLabel)(({ theme }) => ({
  '& .MuiStepLabel-label': {
    marginTop: '8px',
    fontSize: '0.875rem',
    fontWeight: 400,
    color: '#4F4F4F',
    letterSpacing: '-0.01em',
    textTransform: 'none',
    
    '&.Mui-active': {
      color: '#000000',
    },
    '&.Mui-completed': {
      color: '#000000',
    },
  },
}));

const Stepper = ({ activeStep }) => {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 3, sm: 4 }, 
        borderRadius: 0, 
        mb: 5,
        background: 'white',
        border: '1px solid #E0E0E0',
      }}
    >
      <Typography 
        variant="h4" 
        component="h2" 
        sx={{ 
          fontWeight: 400, 
          letterSpacing: '-0.02em', 
          mb: 4,
          color: '#000000'
        }}
      >
        Tech Interview Analyzer
      </Typography>
      
      <MuiStepper 
        activeStep={activeStep - 1} 
        alternativeLabel
        connector={<MinimalConnector />}
        sx={{ mt: 2 }}
      >
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabelStyled StepIconComponent={StepIcon}>{label}</StepLabelStyled>
          </Step>
        ))}
      </MuiStepper>
    </Paper>
  );
};

export default Stepper; 