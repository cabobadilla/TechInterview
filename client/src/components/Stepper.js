import React from 'react';
import { 
  Stepper as MuiStepper, 
  Step, 
  StepLabel, 
  Paper, 
  styled,
  StepConnector,
  stepConnectorClasses
} from '@mui/material';
import { Check } from '@mui/icons-material';

const steps = [
  'Subir Transcript',
  'Seleccionar Caso',
  'Ver Resultados'
];

// Conector personalizado con estilo de Google
const GoogleConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: theme.palette.primary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: theme.palette.primary.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#E8EAED',
    borderRadius: 1,
  },
}));

// Icono personalizado para los pasos del stepper
const StepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#E8EAED',
  zIndex: 1,
  color: '#FFF',
  width: 48,
  height: 48,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'all 0.2s ease',
  ...(ownerState.active && {
    backgroundColor: theme.palette.primary.main,
    boxShadow: '0 4px 10px 0 rgba(66, 133, 244, 0.25)',
  }),
  ...(ownerState.completed && {
    backgroundColor: theme.palette.primary.main,
  }),
}));

const StepIcon = (props) => {
  const { active, completed, className, icon } = props;

  return (
    <StepIconRoot ownerState={{ active, completed }} className={className}>
      {completed ? (
        <Check sx={{ fontSize: 24, color: 'white' }} />
      ) : (
        <span style={{ 
          color: active ? 'white' : '#5F6368', 
          fontSize: 18, 
          fontWeight: 500 
        }}>
          {icon}
        </span>
      )}
    </StepIconRoot>
  );
};

const StepLabelStyled = styled(StepLabel)(({ theme }) => ({
  '& .MuiStepLabel-label': {
    marginTop: '8px',
    fontSize: '0.95rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
    
    '&.Mui-active': {
      color: theme.palette.primary.main,
      fontWeight: 600,
    },
    '&.Mui-completed': {
      color: theme.palette.text.primary,
      fontWeight: 500,
    },
  },
}));

const Stepper = ({ activeStep }) => {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        borderRadius: 2, 
        mb: 3,
        background: 'white',
        border: '1px solid #E8EAED'
      }}
    >
      <MuiStepper 
        activeStep={activeStep - 1} 
        alternativeLabel
        connector={<GoogleConnector />}
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