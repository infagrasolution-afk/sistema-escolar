import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Wrapper de seguridad para proteger rutas en React Router v6.
 * Redirige a /login si no hay token o a la primera ruta válida si el rol/módulo no es permitido.
 */
export const ProtectedRoute = ({ children, allowedRoles, moduleKey }) => {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // SUPER_ADMIN posee acceso universal implícito
  if (userRole === 'SUPER_ADMIN') {
    return children;
  }

  // Validar Roles
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  // Validar Módulos Permitidos asignados al usuario
  let modulosPermitidos = null;
  try {
    const raw = localStorage.getItem('modulos_permitidos');
    if (raw) modulosPermitidos = JSON.parse(raw);
  } catch (e) {
    modulosPermitidos = null;
  }

  if (moduleKey && Array.isArray(modulosPermitidos) && modulosPermitidos.length > 0) {
    const isPermitted =
      modulosPermitidos.includes(moduleKey) ||
      (moduleKey === 'colegio_config' && modulosPermitidos.includes('colegio'));

    if (!isPermitted) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
