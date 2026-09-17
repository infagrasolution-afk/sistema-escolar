import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Wrapper de seguridad para proteger rutas en React Router v6.
 * Redirige a /login si no hay token o a / unauthenticated si el rol no es válido.
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // SUPER_ADMIN posee acceso universal implícito
  if (allowedRoles && userRole !== 'SUPER_ADMIN' && !allowedRoles.includes(userRole)) {
    return (
      <Navigate
        to={
          userRole === 'ADMIN_CARNET' || userRole === 'OPERADOR_IMPRESION'
            ? '/carnets'
            : userRole === 'OPERADOR_ESCANEO'
            ? '/kiosco'
            : '/estudiantes'
        }
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
