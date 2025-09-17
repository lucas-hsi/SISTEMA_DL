'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

interface VendedorLayoutProps {
  children: React.ReactNode;
}

const VendedorLayout = ({ children }: VendedorLayoutProps) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      if (isLoading) return;

      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      // LÓGICA HIERÁRQUICA: Permitir acesso se for 'vendedor' OU 'gestor'
      const allowedRoles = ['vendedor', 'gestor'];
      const currentRole = user?.role;
      
      if (!currentRole || !allowedRoles.includes(currentRole)) {
        // Se não for vendedor nem gestor, redirecionar para login
        router.push('/login');
        return;
      }

      setHasAccess(true);
    };

    checkAccess();
  }, [isAuthenticated, isLoading, user, router, logout]);

  // LÓGICA CONDICIONAL APÓS TODAS AS CHAMADAS DE HOOKS
  if (isLoading || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="flex gap-4 h-[calc(100vh-2rem)]">
        {/* Sidebar */}
        <Sidebar 
          className={`transition-all duration-300 ease-in-out z-30 ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
          roleDisplayName="do Vendedor"
          collapsed={sidebarCollapsed}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Header */}
          <Header 
            className="z-20" 
            onToggleSidebar={toggleSidebar}
            sidebarCollapsed={sidebarCollapsed}
          />
          
          {/* Page Content */}
          <main className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default VendedorLayout;