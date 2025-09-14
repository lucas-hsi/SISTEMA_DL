'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

interface GestorLayoutProps {
  children: React.ReactNode;
}

const GestorLayout = ({ children }: GestorLayoutProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Verificar tokens de autenticação (priorizar access_token)
        const accessToken = localStorage.getItem('access_token');
        const token = localStorage.getItem('token');
        const authToken = accessToken || token;
        
        // Verificar perfil do usuário (priorizar selectedRole)
        const selectedRole = localStorage.getItem('selectedRole');
        const userProfile = localStorage.getItem('userProfile');
        const currentProfile = selectedRole || userProfile;

        // Verificar se o usuário está autenticado e tem perfil
        if (!authToken || !currentProfile) {
          router.push('/login');
          return;
        }

        // Verificar se o perfil é de gestor (case insensitive)
        if (currentProfile.toLowerCase() !== 'gestor') {
          // Se não for gestor, redirecionar para a página apropriada ou login
          localStorage.removeItem('access_token');
          localStorage.removeItem('token');
          localStorage.removeItem('userProfile');
          localStorage.removeItem('selectedRole');
          router.push('/login');
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderizar nada (redirecionamento já foi feito)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <Sidebar className="fixed left-0 top-0 h-full z-30" />
      
      {/* Main Content Area */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <Header className="sticky top-0 z-20" />
        
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

export default GestorLayout;