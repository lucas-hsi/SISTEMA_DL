import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import Loading from './ui/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  requireAuth = true,
  redirectTo = '/login'
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="protected-route-loading">
        <Loading 
          size="lg" 
          text="Verificando permissões..." 
        />
      </div>
    );
  }

  // Se requer autenticação mas não há usuário logado
  if (requireAuth && !user) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Se há roles específicos definidos, verificar se o usuário tem permissão
  if (allowedRoles.length > 0 && user) {
    const hasPermission = allowedRoles.includes(user.role);
    
    if (!hasPermission) {
      // Redirecionar para dashboard apropriado baseado no role do usuário
      const dashboardRoutes: Record<UserRole, string> = {
        [UserRole.GESTOR]: '/dashboard/gestor',
        [UserRole.VENDEDOR]: '/dashboard/vendedor',
        [UserRole.ANUNCIOS]: '/dashboard/anuncios'
      };
      
      const redirectTo = dashboardRoutes[user.role] || '/dashboard/gestor';
      
      return (
        <Navigate 
          to={redirectTo} 
          replace 
        />
      );
    }
  }

  // Se passou por todas as verificações, renderizar o componente
  return <>{children}</>;
};

// Higher-order component for role-based protection
export const withRoleProtection = (
  Component: React.ComponentType,
  allowedRoles: UserRole[]
) => {
  return (props: any) => (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Specific role components
export const GestorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={[UserRole.GESTOR]}>
    {children}
  </ProtectedRoute>
);

export const VendedorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={[UserRole.VENDEDOR]}>
    {children}
  </ProtectedRoute>
);

export const AnunciosRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={[UserRole.ANUNCIOS]}>
    {children}
  </ProtectedRoute>
);

// Public route component (redirects authenticated users to their dashboard)
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="public-route-loading">
        <Loading size="lg" />
      </div>
    );
  }

  // Redirecionar usuários autenticados para seu dashboard
  if (user) {
    const dashboardRoutes: Record<UserRole, string> = {
      [UserRole.GESTOR]: '/dashboard/gestor',
      [UserRole.VENDEDOR]: '/dashboard/vendedor',
      [UserRole.ANUNCIOS]: '/dashboard/anuncios'
    };

    const userDashboard = dashboardRoutes[user.role] || '/dashboard/gestor';
    
    return (
      <Navigate 
        to={userDashboard} 
        replace 
      />
    );
  }

  // Renderizar conteúdo público para usuários não autenticados
  return <>{children}</>;
};

export default ProtectedRoute;