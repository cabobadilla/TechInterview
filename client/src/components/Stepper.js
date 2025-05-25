import React from 'react';
import { 
  Stepper as MuiStepper, 
  Step, 
  StepLabel, 
  Paper, 
  styled,
  StepConnector,
  stepConnectorClasses,
  Typography,
  useTheme
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
      borderColor: '#7DE1C3',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#7DE1C3',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: '#1E3A54',
    borderTopWidth: 1,
    borderRadius: 0,
  },
}));

// Icono personalizado para los pasos del stepper
const StepIconRoot = styled('div')(({ theme, ownerState }) => ({
  display: 'flex',
  height: 22,
  alignItems: 'center',
  color: '#1E3A54',
  zIndex: 1,
  ...(ownerState.active && {
    color: '#7DE1C3',
  }),
  ...(ownerState.completed && {
    color: '#7DE1C3',
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
    color: theme.palette.text.secondary,
    letterSpacing: '-0.01em',
    textTransform: 'none',
    
    '&.Mui-active': {
      color: '#7DE1C3',
    },
    '&.Mui-completed': {
      color: '#7DE1C3',
    },
  },
}));

const Stepper = ({ activeStep }) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 3, sm: 4 }, 
        borderRadius: 0, 
        mb: 5,
        border: '1px solid #1E3A54',
      }}
    >
      <Typography 
        variant="h4" 
        component="h2" 
        sx={{ 
          fontWeight: 400, 
          letterSpacing: '-0.02em', 
          mb: 4,
          color: '#7DE1C3'
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