import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  IconButton,
  Chip,
  Avatar,
  Divider,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SchoolIcon from '@mui/icons-material/School';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import BusinessIcon from '@mui/icons-material/Business';
import LogoutIcon from '@mui/icons-material/Logout';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useColorMode } from '../themeContext';

const DRAWER_WIDTH = 260;

export const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();

  const userRole = localStorage.getItem('user_role') || '';
  const userEmail = localStorage.getItem('user_email') || '';

  let modulosPermitidos = null;
  try {
    const raw = localStorage.getItem('modulos_permitidos');
    if (raw) modulosPermitidos = JSON.parse(raw);
  } catch (e) {
    modulosPermitidos = null;
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    localStorage.removeItem('modulos_permitidos');
    navigate('/login');
  };

  const menuItems = [
    {
      text: 'Kiosco de Garita',
      icon: <QrCodeScannerIcon />,
      path: '/kiosco',
      moduleKey: 'kiosco',
      roles: ['OPERADOR_ESCANEO', 'ADMIN_ACCESO', 'SUPER_ADMIN'],
    },
    {
      text: 'Carnetización PVC',
      icon: <CreditCardIcon />,
      path: '/carnets',
      moduleKey: 'carnets',
      roles: ['ADMIN_CARNET', 'OPERADOR_IMPRESION', 'SUPER_ADMIN'],
    },
    {
      text: 'Configuración Colegio',
      icon: <BusinessIcon />,
      path: '/colegio/config',
      moduleKey: 'colegio_config',
      roles: ['ADMIN_CARNET', 'ADMIN_ACCESO', 'SUPER_ADMIN'],
    },
    {
      text: 'Estudiantes',
      icon: <SchoolIcon />,
      path: '/estudiantes',
      moduleKey: 'estudiantes',
      roles: ['ADMIN_CARNET', 'ADMIN_ACCESO', 'SUPER_ADMIN'],
    },
    {
      text: 'Representantes',
      icon: <FamilyRestroomIcon />,
      path: '/representantes',
      moduleKey: 'representantes',
      roles: ['ADMIN_CARNET', 'ADMIN_ACCESO', 'SUPER_ADMIN'],
    },
    {
      text: 'Usuarios y Permisos',
      icon: <ManageAccountsIcon />,
      path: '/usuarios',
      moduleKey: 'usuarios',
      roles: ['ADMIN_CARNET', 'ADMIN_ACCESO', 'SUPER_ADMIN'],
    },
    {
      text: 'Dashboard Owner',
      icon: <AdminPanelSettingsIcon />,
      path: '/admin/dashboard',
      moduleKey: 'dashboard',
      roles: ['SUPER_ADMIN'],
    },
  ];

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        bgcolor: mode === 'dark' ? '#1e293b' : '#ffffff',
        color: mode === 'dark' ? '#ffffff' : '#0f172a',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box p={3} display="flex" alignItems="center" gap={1.5}>
        <SchoolIcon sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
        <Typography variant="h6" fontWeight="bold">
          Sistema Escolar
        </Typography>
      </Box>

      <Divider sx={{ borderColor: mode === 'dark' ? '#334155' : '#e2e8f0' }} />

      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {menuItems.map((item) => {
          const isRoleAllowed = userRole === 'SUPER_ADMIN' || item.roles.includes(userRole);
          if (!isRoleAllowed) return null;

          if (userRole !== 'SUPER_ADMIN' && Array.isArray(modulosPermitidos) && modulosPermitidos.length > 0) {
            if (item.moduleKey) {
              const isModuleAllowed =
                modulosPermitidos.includes(item.moduleKey) ||
                (item.moduleKey === 'colegio_config' && modulosPermitidos.includes('colegio'));
              if (!isModuleAllowed) return null;
            }
          }

          const selected = location.pathname === item.path;

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                selected={selected}
                sx={{
                  borderRadius: 2,
                  bgcolor: selected
                    ? mode === 'dark'
                      ? 'rgba(56, 189, 248, 0.15)'
                      : 'rgba(2, 132, 199, 0.12)'
                    : 'transparent',
                  color: selected ? theme.palette.primary.main : mode === 'dark' ? '#94a3b8' : '#475569',
                  '&:hover': {
                    bgcolor: mode === 'dark' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(2, 132, 199, 0.08)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: selected ? theme.palette.primary.main : mode === 'dark' ? '#94a3b8' : '#64748b',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontWeight: selected ? 'bold' : 'medium' }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: mode === 'dark' ? '#334155' : '#e2e8f0' }} />

      {/* Perfil de Usuario en el Menú */}
      <Box p={2.5} display="flex" alignItems="center" gap={1.5}>
        <Avatar
          sx={{
            bgcolor: theme.palette.primary.main,
            width: 36,
            height: 36,
            color: '#ffffff',
            fontWeight: 'bold',
          }}
        >
          {userEmail[0]?.toUpperCase() || 'U'}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle2" noWrap fontWeight="bold">
            {userEmail.split('@')[0]}
          </Typography>
          <Chip label={userRole} size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top Navbar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff',
          color: mode === 'dark' ? '#ffffff' : '#0f172a',
          boxShadow: mode === 'dark' ? 'none' : '0 1px 3px 0 rgba(0,0,0,0.1)',
          borderBottom: mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Control de Asistencia y Carnetización
          </Typography>

          {/* Selector de Tema Claro / Oscuro */}
          <IconButton
            onClick={toggleColorMode}
            color="inherit"
            sx={{ mr: 1 }}
            title={mode === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {mode === 'dark' ? <LightModeIcon sx={{ color: '#fba919' }} /> : <DarkModeIcon sx={{ color: '#475569' }} />}
          </IconButton>

          <IconButton color="error" onClick={handleLogout} title="Cerrar Sesión">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer Navegación */}
      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Contenido Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: theme.palette.background.default,
          pt: '64px',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppLayout;
