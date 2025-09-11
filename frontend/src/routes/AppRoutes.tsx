import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute, { PublicRoute, GestorRoute, VendedorRoute, AnunciosRoute } from '../components/ProtectedRoute';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import TwoFactorAuth from '../pages/TwoFactorAuth';
import ManagerDashboard from '../pages/ManagerDashboard';
import VendedorDashboard from '../pages/VendedorDashboard';
import AnunciosDashboard from '../pages/AnunciosDashboard';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

// Placeholder components for future implementation
const NotFound: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '100vh',
    fontFamily: 'Inter, sans-serif'
  }}>
    <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0', color: '#1f2937' }}>404</h1>
    <p style={{ fontSize: '1.125rem', color: '#6b7280', margin: '0 0 2rem 0' }}>Página não encontrada</p>
    <a 
      href="/" 
      style={{ 
        color: '#3b82f6', 
        textDecoration: 'none',
        padding: '0.75rem 1.5rem',
        border: '1px solid #3b82f6',
        borderRadius: '0.5rem',
        transition: 'all 0.2s ease'
      }}
    >
      Voltar ao início
    </a>
  </div>
);

const Unauthorized: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '100vh',
    fontFamily: 'Inter, sans-serif'
  }}>
    <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0', color: '#dc2626' }}>403</h1>
    <p style={{ fontSize: '1.125rem', color: '#6b7280', margin: '0 0 2rem 0' }}>Acesso não autorizado</p>
    <a 
      href="/login" 
      style={{ 
        color: '#3b82f6', 
        textDecoration: 'none',
        padding: '0.75rem 1.5rem',
        border: '1px solid #3b82f6',
        borderRadius: '0.5rem',
        transition: 'all 0.2s ease'
      }}
    >
      Fazer login
    </a>
  </div>
);

// Dashboard redirect component
const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirecionar para dashboard apropriado baseado no perfil do usuário
  const dashboardRoutes: Record<UserRole, string> = {
    [UserRole.GESTOR]: '/dashboard/gestor',
    [UserRole.VENDEDOR]: '/dashboard/vendedor',
    [UserRole.ANUNCIOS]: '/dashboard/anuncios'
  };

  const userDashboard = dashboardRoutes[user.role] || '/dashboard/gestor';
  
  return <Navigate to={userDashboard} replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/2fa" 
        element={
          <ProtectedRoute>
            <TwoFactorAuth />
          </ProtectedRoute>
        } 
      />

      {/* Dashboard Redirect */}
      <Route 
        path="/dashboard" 
        element={<DashboardRedirect />} 
      />

      {/* Dashboard Routes with Layout */}
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Gestor Routes */}
        <Route 
          path="gestor" 
          element={
            <GestorRoute>
              <ManagerDashboard />
            </GestorRoute>
          } 
        />
        
        {/* Future Gestor routes */}
        <Route 
          path="gestor/*" 
          element={
            <GestorRoute>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: '50vh',
                fontFamily: 'Inter, sans-serif'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ color: '#22c55e', margin: '0 0 1rem 0' }}>Área do Gestor</h2>
                  <p style={{ color: '#6b7280' }}>Esta funcionalidade será implementada em breve.</p>
                </div>
              </div>
            </GestorRoute>
          } 
        />

        {/* Vendedor Routes */}
        <Route 
          path="vendedor" 
          element={
            <VendedorRoute>
              <VendedorDashboard />
            </VendedorRoute>
          } 
        />
        
        {/* Future Vendedor routes */}
        <Route 
          path="vendedor/*" 
          element={
            <VendedorRoute>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: '50vh',
                fontFamily: 'Inter, sans-serif'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ color: '#3b82f6', margin: '0 0 1rem 0' }}>Área do Vendedor</h2>
                  <p style={{ color: '#6b7280' }}>Esta funcionalidade será implementada em breve.</p>
                </div>
              </div>
            </VendedorRoute>
          } 
        />

        {/* Anuncios Routes */}
        <Route 
          path="anuncios" 
          element={
            <AnunciosRoute>
              <AnunciosDashboard />
            </AnunciosRoute>
          } 
        />
        
        {/* Future Anuncios routes */}
        <Route 
          path="anuncios/*" 
          element={
            <AnunciosRoute>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: '50vh',
                fontFamily: 'Inter, sans-serif'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ color: '#8b5cf6', margin: '0 0 1rem 0' }}>Área de Anúncios</h2>
                  <p style={{ color: '#6b7280' }}>Esta funcionalidade será implementada em breve.</p>
                </div>
              </div>
            </AnunciosRoute>
          } 
        />
      </Route>

      {/* Root redirect */}
      <Route 
        path="/" 
        element={<DashboardRedirect />} 
      />

      {/* Error Routes */}
      <Route 
        path="/unauthorized" 
        element={<Unauthorized />} 
      />

      {/* 404 - Not Found */}
      <Route 
        path="*" 
        element={<NotFound />} 
      />
    </Routes>
  );
};

export default AppRoutes;