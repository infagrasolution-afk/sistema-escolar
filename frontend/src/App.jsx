import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import CustomThemeProvider from './themeContext';
import LoginView from './components/LoginView';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import KioskScanner from './components/KioskScanner';
import ColegioConfigView from './components/ColegioConfigView';
import StudentCardPrint from './components/StudentCardPrint';
import StudentManagement from './components/StudentManagement';
import RepresentativeManagement from './components/RepresentativeManagement';
import UserManagement from './components/UserManagement';
import OwnerDashboard from './components/OwnerDashboard';

export const App = () => {
  return (
    <CustomThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta Pública de Autenticación */}
          <Route path="/login" element={<LoginView />} />

          {/* Rutas Protegidas enmarcadas en AppLayout Shell */}
          <Route element={<AppLayout />}>
            <Route
              path="/kiosco"
              element={
                <ProtectedRoute allowedRoles={['OPERADOR_ESCANEO', 'ADMIN_ACCESO', 'SUPER_ADMIN']} moduleKey="kiosco">
                  <KioskScanner />
                </ProtectedRoute>
              }
            />

            <Route
              path="/carnets"
              element={
                <ProtectedRoute allowedRoles={['ADMIN_CARNET', 'OPERADOR_IMPRESION', 'SUPER_ADMIN']} moduleKey="carnets">
                  <StudentCardPrint />
                </ProtectedRoute>
              }
            />

            <Route
              path="/colegio/config"
              element={
                <ProtectedRoute allowedRoles={['ADMIN_CARNET', 'ADMIN_ACCESO', 'SUPER_ADMIN']} moduleKey="colegio_config">
                  <ColegioConfigView />
                </ProtectedRoute>
              }
            />

            <Route
              path="/estudiantes"
              element={
                <ProtectedRoute allowedRoles={['ADMIN_CARNET', 'ADMIN_ACCESO', 'SUPER_ADMIN']} moduleKey="estudiantes">
                  <StudentManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/representantes"
              element={
                <ProtectedRoute allowedRoles={['ADMIN_CARNET', 'ADMIN_ACCESO', 'SUPER_ADMIN']} moduleKey="representantes">
                  <RepresentativeManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/usuarios"
              element={
                <ProtectedRoute allowedRoles={['ADMIN_CARNET', 'ADMIN_ACCESO', 'SUPER_ADMIN']} moduleKey="usuarios">
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']} moduleKey="dashboard">
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </CustomThemeProvider>
  );
};

export default App;
