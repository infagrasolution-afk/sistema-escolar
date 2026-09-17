import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

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
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública de Autenticación */}
        <Route path="/login" element={<LoginView />} />

        {/* Rutas Protegidas enmarcadas en AppLayout Shell */}
        <Route element={<AppLayout />}>
          <Route
            path="/kiosco"
            element={
              <ProtectedRoute allowedRoles={['OPERADOR_ESCANEO', 'ADMIN_ACCESO', 'SUPER_ADMIN']}>
                <KioskScanner />
              </ProtectedRoute>
            }
          />

          <Route
            path="/carnets"
            element={
              <ProtectedRoute allowedRoles={['ADMIN_CARNET', 'OPERADOR_IMPRESION', 'SUPER_ADMIN']}>
                <StudentCardPrint />
              </ProtectedRoute>
            }
          />

          <Route
            path="/colegio/config"
            element={
              <ProtectedRoute allowedRoles={['ADMIN_CARNET', 'ADMIN_ACCESO', 'SUPER_ADMIN']}>
                <ColegioConfigView />
              </ProtectedRoute>
            }
          />


          <Route
            path="/estudiantes"
            element={
              <ProtectedRoute allowedRoles={['ADMIN_CARNET', 'ADMIN_ACCESO', 'SUPER_ADMIN']}>
                <StudentManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/representantes"
            element={
              <ProtectedRoute allowedRoles={['ADMIN_CARNET', 'ADMIN_ACCESO', 'SUPER_ADMIN']}>
                <RepresentativeManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuarios"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
