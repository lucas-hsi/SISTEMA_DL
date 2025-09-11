import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { useFocusTrap, useScreenReader } from '../hooks/useKeyboardNavigation';
import Sidebar from './Sidebar';
import './Layout.css';

// Ícones de tema
const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const { announce } = useScreenReader();
  const location = useLocation();
  const focusTrapRef = useFocusTrap(!sidebarCollapsed && (isMobile || isTablet));

  // Auto-colapsar sidebar em mobile e tablet
  useEffect(() => {
    if (isMobile || isTablet) {
      setSidebarCollapsed(true);
    } else {
      // Em desktop, manter estado anterior ou expandir por padrão
      const savedState = localStorage.getItem('sidebarCollapsed');
      setSidebarCollapsed(savedState === 'true');
    }
  }, [isMobile, isTablet, location.pathname]);

  // Salvar estado da sidebar no localStorage
  useEffect(() => {
    if (!isMobile && !isTablet) {
      localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString());
    }
  }, [sidebarCollapsed, isMobile, isTablet]);

  // Função para toggle do sidebar
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    announce(newState ? 'Menu fechado' : 'Menu aberto');
  };

  // Função para fechar sidebar em mobile/tablet quando clicar no overlay
  const closeSidebar = () => {
    if (isMobile || isTablet) {
      setSidebarCollapsed(true);
    }
  };

  // Fechar sidebar ao navegar em mobile/tablet
  useEffect(() => {
    if ((isMobile || isTablet) && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [location.pathname, isMobile, isTablet]);

  // Se não há usuário logado, renderizar apenas o conteúdo
  if (!user) {
    return (
      <div className="layout layout--no-auth" data-theme={theme}>
        {children || <Outlet />}
      </div>
    );
  }

  return (
    <div className={`layout ${theme}`} data-theme={theme}>
      {/* Sidebar */}
      <div ref={focusTrapRef as React.RefObject<HTMLDivElement>}>
        <Sidebar 
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          isMobile={isMobile}
          onClose={closeSidebar}
        />
      </div>

      {/* Overlay para mobile/tablet */}
      {(isMobile || isTablet) && !sidebarCollapsed && (
        <div 
          className="layout__overlay"
          onClick={closeSidebar}
          onTouchStart={closeSidebar}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              closeSidebar();
            }
          }}
          aria-hidden="true"
          role="button"
          tabIndex={0}
          aria-label="Fechar menu"
        />
      )}

      {/* Conteúdo principal */}
      <main 
        className={`layout__main ${
          sidebarCollapsed ? 'layout__main--collapsed' : ''
        } ${
          isMobile || isTablet ? 'layout__main--mobile' : ''
        }`}
      >
        {/* Header */}
        <header className="layout__header">
          <div className="layout__header-content">
            {/* Botão do menu para mobile/tablet */}
            {(isMobile || isTablet) && (
              <button
                className="layout__menu-toggle"
                onClick={toggleSidebar}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSidebar();
                  }
                }}
                aria-label={sidebarCollapsed ? "Abrir menu" : "Fechar menu"}
                aria-expanded={!sidebarCollapsed}
                aria-controls="sidebar-navigation"
              >
                {sidebarCollapsed ? (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="6" />
                    <line x1="18" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="18" x2="6" y2="18" />
                  </svg>
                )}
              </button>
            )}

            {/* Breadcrumb */}
            <div className="layout__breadcrumb">
              <h1 className="layout__page-title" id="page-title" tabIndex={-1}>
                {getPageTitle(location.pathname)}
              </h1>
            </div>

            {/* Ações do header */}
            <div className="layout__header-actions">
              {/* Toggle de tema */}
              <button 
                className="layout__action-btn layout__theme-toggle"
                onClick={toggleTheme}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleTheme();
                  }
                }}
                aria-label={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
                title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
              >
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </button>

              {/* Notificações */}
              <button 
                className="layout__action-btn"
                aria-label="Notificações (3 não lidas)"
                aria-describedby="notification-count"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // Implementar ação de notificações
                  }
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                <span 
                  className="layout__notification-badge"
                  id="notification-count"
                  aria-label="3 notificações não lidas"
                >
                  3
                </span>
              </button>

              {/* Perfil do usuário */}
              <div className="layout__user-menu">
                <button 
                  className="layout__user-btn"
                  aria-label="Menu do usuário"
                >
                  <div className="layout__user-avatar">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="layout__user-name">
                    {user.name || 'Usuário'}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6,9 12,15 18,9" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <div 
          className="layout__content"
          role="main"
          aria-labelledby="page-title"
          tabIndex={-1}
        >
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

// Função para obter o título da página baseado na rota
function getPageTitle(pathname: string): string {
  const routes: Record<string, string> = {
    '/dashboard/gestor': 'Dashboard Gestor',
    '/dashboard/vendedor': 'Dashboard Vendedor', 
    '/dashboard/anuncios': 'Dashboard Anúncios',
    '/produtos': 'Produtos',
    '/vendas': 'Vendas',
    '/clientes': 'Clientes',
    '/estoque': 'Estoque',
    '/relatorios': 'Relatórios',
    '/anuncios': 'Anúncios',
    '/configuracoes': 'Configurações',
    '/perfil': 'Perfil',
  };

  return routes[pathname] || 'Dashboard';
}

export default Layout;