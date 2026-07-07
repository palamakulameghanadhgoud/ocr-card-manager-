import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#14b8a6', // Teal
      light: '#2dd4bf',
      dark: '#0f766e',
      contrastText: '#070b13',
    },
    secondary: {
      main: '#fb923c', // Orange
      light: '#fdba74',
      dark: '#ea580c',
      contrastText: '#070b13',
    },
    background: {
      default: '#050a12',
      paper: 'rgba(15, 23, 42, 0.55)', // Translucent dark slate for glassmorphism
    },
    text: {
      primary: '#e5eef8',
      secondary: '#94a3b8',
    },
    success: { main: '#10b981' },
    error: { main: '#ef4444' },
  },
  typography: {
    fontFamily: '"Space Grotesk", "Trebuchet MS", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.025em', color: '#f8fafc' },
    h5: { fontWeight: 650, letterSpacing: '-0.015em', color: '#f8fafc' },
    h6: { fontWeight: 600, color: '#f8fafc' },
    subtitle1: { fontWeight: 600, color: '#f8fafc' },
    button: { fontWeight: 600, letterSpacing: '0.02em' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'radial-gradient(circle at top left, rgba(20, 184, 166, 0.12), transparent 35%), radial-gradient(circle at bottom right, rgba(251, 146, 60, 0.08), transparent 40%), linear-gradient(180deg, #050a12 0%, #090f1d 50%, #0d1527 100%)',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          color: '#e5eef8',
          margin: 0,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 18px 40px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          overflow: 'hidden',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 24px 50px rgba(0, 0, 0, 0.55)',
            borderColor: 'rgba(20, 184, 166, 0.25)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          padding: '10px 22px',
          minHeight: 44,
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(20, 184, 166, 0.3)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(1px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
          color: '#070b13',
          '&:hover': {
            background: 'linear-gradient(135deg, #115e59 0%, #0f766e 100%)',
            boxShadow: '0 6px 24px rgba(20, 184, 166, 0.4)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.12)',
          color: '#e5eef8',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            color: '#94a3b8',
          },
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            color: '#e5eef8',
            '&:hover': {
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.08)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(20, 184, 166, 0.35)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#14b8a6',
              borderWidth: 1.5,
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
          borderRadius: 10,
          transition: 'all 0.2s ease',
          color: '#94a3b8',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: '#e5eef8',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: 'rgba(15, 23, 42, 0.72)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: '0 !important',
          textTransform: 'none',
          color: '#94a3b8',
          border: 'none',
          '&.Mui-selected': {
            backgroundColor: 'rgba(20, 184, 166, 0.2)',
            color: '#14b8a6',
            '&:hover': {
              backgroundColor: 'rgba(20, 184, 166, 0.3)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            color: '#e5eef8',
          },
        },
      },
    },
  },
});

export default theme;
