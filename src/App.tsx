import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  ThemeProvider,
  createTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, signOut } from './services/auth';
import { getStoredUser } from './services/api';
import Home from './pages/Home';
import MonthlyReport from './pages/MonthlyReport';
import Analytics from './pages/Analytics';
import Categories from './pages/Categories';
import About from './pages/About';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2c1810', // color-ink
      light: '#594a42', // color-ink-light
      dark: '#1a0f0a',
    },
    secondary: {
      main: '#8b4513', // color-accent
      light: '#a65d2e',
      dark: '#6b3005',
    },
    success: {
      main: '#006400', // color-success
      light: '#007f00',
      dark: '#004d00',
    },
    error: {
      main: '#8b0000', // color-error
      light: '#a60000',
      dark: '#6b0000',
    },
    background: {
      default: '#f4e4bc', // color-paper
      paper: '#f4e4bc',
    },
    text: {
      primary: '#2c1810', // color-ink
      secondary: '#594a42', // color-ink-light
    },
  },
  typography: {
    fontFamily: "'Playfair Display', serif",
    h1: {
      fontFamily: "'Dancing Script', cursive",
      fontWeight: 700,
    },
    h2: {
      fontFamily: "'Dancing Script', cursive",
      fontWeight: 700,
    },
    h3: {
      fontFamily: "'Dancing Script', cursive",
      fontWeight: 700,
    },
    h4: {
      fontFamily: "'Dancing Script', cursive",
      fontWeight: 700,
    },
    h5: {
      fontFamily: "'Dancing Script', cursive",
      fontWeight: 700,
    },
    h6: {
      fontFamily: "'Dancing Script', cursive",
      fontWeight: 700,
    },
    button: {
      fontFamily: "'IBM Plex Mono', monospace",
      textTransform: 'none',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#f4e4bc',
          borderRadius: 0,
          border: '1px solid #594a42',
          boxShadow: '2px 3px 10px rgba(0, 0, 0, 0.1)',
          '&.summary-card': {
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: 'transparent',
            border: '2px solid var(--color-ink-light)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                linear-gradient(45deg, var(--color-paper-dark) 25%, transparent 25%) -50px 0,
                linear-gradient(-45deg, var(--color-paper-dark) 25%, transparent 25%) -50px 0,
                linear-gradient(45deg, transparent 75%, var(--color-paper-dark) 75%) -50px 0,
                linear-gradient(-45deg, transparent 75%, var(--color-paper-dark) 75%) -50px 0
              `,
              backgroundSize: '100px 100px',
              opacity: 0.1,
              zIndex: -1,
            },
            '& .MuiTypography-subtitle2': {
              fontFamily: 'var(--font-handwritten)',
              fontSize: '1.2rem',
              marginBottom: '0.5rem',
            },
            '& .MuiTypography-h6': {
              fontFamily: 'var(--font-typewriter)',
              fontSize: '1.1rem',
              fontWeight: 600,
              '&.success': {
                color: 'var(--color-success)',
              },
              '&.error': {
                color: 'var(--color-error)',
              },
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: 'none',
          boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.2)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '3px 3px 7px rgba(0, 0, 0, 0.3)',
          },
          '&:active': {
            transform: 'translateY(1px)',
            boxShadow: '1px 1px 3px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            fontFamily: "'IBM Plex Mono', monospace",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: "'IBM Plex Mono', monospace",
          borderBottom: '1px solid #594a42',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#e6d5b0',
          borderBottom: '2px solid #2c1810',
        },
      },
    },
  },
});

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const location = useLocation();

  if (loading) {
    return <Box>Cargando...</Box>;
  }

  if (!user && location.pathname !== '/about') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [user] = useAuthState(auth);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleProfileOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      handleProfileClose();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <BrowserRouter>
          <Box className="paper-grid">
            <Box className="main-container">
              <AppBar 
                position="static" 
                elevation={0}
                sx={{ 
                  backgroundColor: 'var(--color-paper-dark)',
                  borderBottom: '2px solid var(--color-ink)',
                  color: 'var(--color-ink)',
                }}
              >
                <Toolbar>
                  {user && (
                    <IconButton
                      size="large"
                      edge="start"
                      sx={{ 
                        color: 'var(--color-ink)',
                        mr: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        }
                      }}
                      aria-label="menu"
                      onClick={handleMenuOpen}
                    >
                      <MenuIcon />
                    </IconButton>
                  )}
                  <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ 
                      flexGrow: 1,
                      fontFamily: 'var(--font-handwritten)',
                      fontWeight: 700
                    }}
                  >
                    Cuentas
                  </Typography>
                  {user && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        onClick={handleProfileOpen}
                        size="large"
                        sx={{ 
                          ml: 2,
                          border: '1px solid var(--color-ink-light)',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                          }
                        }}
                      >
                        <Avatar
                          alt={user.displayName || ''}
                          src={user.photoURL || ''}
                          sx={{ width: 32, height: 32 }}
                        />
                      </IconButton>
                    </Box>
                  )}
                </Toolbar>
              </AppBar>

              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    backgroundColor: 'var(--color-paper)',
                    border: '1px solid var(--color-ink-light)',
                    borderRadius: 0,
                    mt: 1,
                  }
                }}
              >
                <MenuItem
                  component={Link}
                  to="/"
                  onClick={handleMenuClose}
                >
                  Inicio
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/monthly-report"
                  onClick={handleMenuClose}
                >
                  Reporte Mensual
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/analytics"
                  onClick={handleMenuClose}
                >
                  Análisis
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/categories"
                  onClick={handleMenuClose}
                >
                  Categorías
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/about"
                  onClick={handleMenuClose}
                >
                  Acerca de
                </MenuItem>
              </Menu>

              <Menu
                anchorEl={profileAnchorEl}
                open={Boolean(profileAnchorEl)}
                onClose={handleProfileClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  sx: {
                    backgroundColor: 'var(--color-paper)',
                    border: '1px solid var(--color-ink-light)',
                    borderRadius: 0,
                    mt: 1,
                  }
                }}
              >
                {(user?.displayName || getStoredUser()?.name) && (
                  <MenuItem disabled>
                    Sesión iniciada como {getStoredUser()?.name || user?.displayName}
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  Cerrar Sesión
                </MenuItem>
              </Menu>

              <Container sx={{ py: 4 }} className="paper-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route
                    path="/monthly-report"
                    element={
                      <ProtectedRoute>
                        <MonthlyReport />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute>
                        <Analytics />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/categories"
                    element={
                      <ProtectedRoute>
                        <Categories />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Container>
            </Box>
          </Box>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
