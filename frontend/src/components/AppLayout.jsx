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
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const DRAWER_WIDTH = 260;

export const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = localStorage.getItem('user_role') || '';
  const userEmail = localStorage.getItem('user_email') || '';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    navigate('/login');
  };

  const menuItems = [
    {
      text: 'Kiosco de Garita',
      icon: <QrCodeScannerIcon />,
      path: '/kiosco',
      roles: ['OPERADOR_ESCANEO', 'ADMIN_ACCESO', 'SUPER_ADMIN'],
    },
    {
      text: 'Carnetización PVC',
      icon: <CreditCardIcon />,
      path: '/carnets',
      roles: ['ADMIN_CARNET', 'OPERADOR_IMPRESION', 'SUPER_ADMIN'],
    },
    {
      text: 'Configuración Colegio',
      icon: <BusinessIcon />,
      path: '/colegio/config',
      roles: ['ADMIN_CARNET', 'ADMIN_ACCESO', 'SUPER_ADMIN'],
    },
    {
      text: 'Estudiantes',
      icon: <SchoolIcon />,
      path: '/estudiantes',
      roles: ['ADMIN_CARNET', 'ADMIN_ACCESO', 'SUPER_ADMIN'],
    },
    {
      text: 'Representantes',
      icon: <FamilyRestroomIcon />,
      path: '/representantes',
      roles: ['ADMIN_CARNET', 'ADMIN_ACCESO', 'SUPER_ADMIN'],
    },
    {
      text: 'Usuarios y Permisos',
      icon: <ManageAccountsIcon />,
      path: '/usuarios',
      roles: ['ADMIN_CARNET', 'ADMIN_ACCESO', 'SUPER_ADMIN'],
    },
    {
      text: 'Dashboard Owner',
      icon: <AdminPanelSettingsIcon />,
      path: '/admin/dashboard',
      roles: ['SUPER_ADMIN'],
    },
  ];


  const drawerContent = (
    <Box sx={{ height: '100%', bgcolor: '#1e293b', color: '#ffffff', display: 'flex', flexDirection: 'column' }}>
      <Box p={3} display="flex" alignItems="center" gap={1.5}>
        <SchoolIcon sx={{ color: '#38bdf8', fontSize: 32 }} />
        <Typography variant="h6" fontWeight="bold">
          Sistema Escolar
        </Typography>
      </Box>

      <Divider sx={{ borderColor: '#334155' }} />

      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {menuItems.map((item) => {
          const isAllowed = userRole === 'SUPER_ADMIN' || item.roles.includes(userRole);
          if (!isAllowed) return null;

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
                  bgcolor: selected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: selected ? '#38bdf8' : '#94a3b8',
                  '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.1)' },
                }}
              >
                <ListItemIcon sx={{ color: selected ? '#38bdf8' : '#94a3b8', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: selected ? 'bold' : 'medium' }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: '#334155' }} />

      {/* Perfil de Usuario en el Menú */}
      <Box p={2.5} display="flex" alignItems="center" gap={1.5}>
        <Avatar sx={{ bgcolor: '#38bdf8', width: 36, height: 36, color: '#0f172a', fontWeight: 'bold' }}>
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
          bgcolor: '#0f172a',
          boxShadow: 'none',
          borderBottom: '1px solid #334155',
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: '1px solid #334155' },
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
          bgcolor: '#0f172a',
          pt: '64px',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppLayout;
