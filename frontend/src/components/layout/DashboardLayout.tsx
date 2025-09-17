'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole: string;
  roleDisplayName: string;
}

const DashboardLayout = ({ children, requiredRole, roleDisplayName }: DashboardLayoutProps) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      if (isLoading) return;
      
      if (!isAuthenticated || !user) {
        router.push('/login');
        return;
      }

      // Verificar se o perfil corresponde ao requerido (case insensitive)
      if (user.role.toLowerCase() !== requiredRole.toLowerCase()) {
        // Se não for o perfil correto, redirecionar para login
        router.push('/login');
        return;
      }

      setHasAccess(true);
    };

    checkAccess();
  }, [isLoading, isAuthenticated, user, router, requiredRole, logout]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não tiver acesso, não renderizar nada (redirecionamento já foi feito)
  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar 
        className="fixed left-0 top-0 h-full z-30" 
        roleDisplayName={roleDisplayName} 
        collapsed={sidebarCollapsed}
      />
      
      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <Header 
          className="sticky top-0 z-20" 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;