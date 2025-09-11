import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useScreenReader } from '../hooks/useKeyboardNavigation';
import { UserRole } from '../types';
import './Sidebar.css';

// Ícones SVG
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const ShoppingCartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
    <circle cx="19" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const BarChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="12" y1="20" x2="12" y2="10" stroke="currentColor" strokeWidth="2"/>
    <line x1="18" y1="20" x2="18" y2="4" stroke="currentColor" strokeWidth="2"/>
    <line x1="6" y1="20" x2="6" y2="16" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const MegaphoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 11v3a1 1 0 0 0 1 1h1l4 4v-14l-4 4H4a1 1 0 0 0-1 1z" stroke="currentColor" strokeWidth="2"/>
    <path d="M13.5 3.5c2.5 2.5 2.5 6.5 0 9M16.5 0.5c4.5 4.5 4.5 11.5 0 16" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2"/>
    <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2"/>
    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  path: string;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: DashboardIcon,
    path: '/dashboard',
    roles: [UserRole.GESTOR, UserRole.VENDEDOR, UserRole.ANUNCIOS]
  },
  {
    id: 'users',
    label: 'Usuários',
    icon: UsersIcon,
    path: '/users',
    roles: [UserRole.GESTOR]
  },
  {
    id: 'products',
    label: 'Produtos',
    icon: ShoppingCartIcon,
    path: '/products',
    roles: [UserRole.GESTOR, UserRole.VENDEDOR]
  },
  {
    id: 'sales',
    label: 'Vendas',
    icon: BarChartIcon,
    path: '/sales',
    roles: [UserRole.GESTOR, UserRole.VENDEDOR]
  },
  {
    id: 'ads',
    label: 'Anúncios',
    icon: MegaphoneIcon,
    path: '/ads',
    roles: [UserRole.GESTOR, UserRole.ANUNCIOS]
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: SettingsIcon,
    path: '/settings',
    roles: [UserRole.GESTOR, UserRole.VENDEDOR, UserRole.ANUNCIOS]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, isMobile, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { announce } = useScreenReader();
  const [activeItem, setActiveItem] = useState<string>('');

  // Cores por perfil
  const getProfileColors = () => {
    if (!user?.role) return { primary: '#3b82f6', secondary: '#1e40af', light: '#dbeafe' };
    
    switch (user.role) {
      case UserRole.GESTOR:
        return { primary: '#22c55e', secondary: '#16a34a', light: '#dcfce7' };
      case UserRole.VENDEDOR:
        return { primary: '#3b82f6', secondary: '#1e40af', light: '#dbeafe' };
      case UserRole.ANUNCIOS:
        return { primary: '#8b5cf6', secondary: '#7c3aed', light: '#ede9fe' };
      default:
        return { primary: '#3b82f6', secondary: '#1e40af', light: '#dbeafe' };
    }
  };

  const colors = getProfileColors();

  // Detectar item ativo baseado na rota atual
  useEffect(() => {
    const currentPath = location.pathname;
    const activeMenuItem = menuItems.find(item => 
      currentPath.startsWith(item.path) || 
      (item.path === '/dashboard' && (currentPath === '/' || currentPath.includes('dashboard')))
    );
    setActiveItem(activeMenuItem?.id || '');
  }, [location.pathname]);

  // Filtrar itens do menu baseado no perfil do usuário
  const filteredMenuItems = menuItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const handleNavigation = (path: string, itemId: string) => {
    setActiveItem(itemId);
    navigate(path);
    announce(`Navegando para ${menuItems.find(item => item.id === itemId)?.label}`);
  };

  const handleLogout = async () => {
    try {
      announce('Fazendo logout...');
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isMobile && !collapsed && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onClose();
            }
          }}
          aria-hidden="true"
          role="button"
          tabIndex={0}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${isMobile ? 'sidebar--mobile' : ''} ${theme}`}
        style={{
          '--sidebar-primary': colors.primary,
          '--sidebar-secondary': colors.secondary,
          '--sidebar-light': colors.light
        } as React.CSSProperties}
        aria-label="Menu de navegação principal"
        role="navigation"
        aria-expanded={!collapsed}
      >
        {/* Header da Sidebar */}
        <div className="sidebar__header">
          <button
            className="sidebar__toggle"
            onClick={onToggle}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-expanded={!collapsed}
            aria-controls="sidebar-navigation"
            onKeyDown={(e) => handleKeyDown(e, onToggle)}
          >
            <MenuIcon />
          </button>
          
          {!collapsed && (
            <div className="sidebar__logo">
              <h2 className="sidebar__title">DL Auto Peças</h2>
              <span className="sidebar__subtitle">
                {user?.role === UserRole.GESTOR && 'Gestor'}
                {user?.role === UserRole.VENDEDOR && 'Vendedor'}
                {user?.role === UserRole.ANUNCIOS && 'Anúncios'}
              </span>
            </div>
          )}
        </div>

        {/* Navegação */}
        <nav className="sidebar__nav" role="navigation" aria-label="Menu principal" id="sidebar-navigation">
          <ul className="sidebar__menu" role="menubar" aria-orientation="vertical">
            {filteredMenuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              
              return (
                <li key={item.id} className="sidebar__menu-item" role="none">
                  <button
                    className={`sidebar__menu-link ${isActive ? 'sidebar__menu-link--active' : ''}`}
                    onClick={() => handleNavigation(item.path, item.id)}
                    onKeyDown={(e) => handleKeyDown(e, () => handleNavigation(item.path, item.id))}
                    aria-current={isActive ? 'page' : undefined}
                    aria-describedby={collapsed ? `tooltip-${item.id}` : undefined}
                    role="menuitem"
                    tabIndex={0}
                    data-keyboard-index={index}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="sidebar__menu-icon" aria-hidden="true">
                      <Icon />
                    </span>
                    {!collapsed && (
                      <span className="sidebar__menu-label">{item.label}</span>
                    )}
                    {collapsed && (
                      <span className="sr-only">{item.label}</span>
                    )}
                  </button>
                  {collapsed && (
                    <div 
                      className="sidebar__tooltip" 
                      role="tooltip"
                      id={`tooltip-${item.id}`}
                      aria-hidden="true"
                    >
                      {item.label}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer da Sidebar */}
        <div className="sidebar__footer">
          {!collapsed && user && (
            <div className="sidebar__user">
              <div className="sidebar__user-avatar">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">{user.name}</span>
                <span className="sidebar__user-email">{user.email}</span>
              </div>
            </div>
          )}
          
          <button
            className="sidebar__logout"
            onClick={handleLogout}
            onKeyDown={(e) => handleKeyDown(e, handleLogout)}
            aria-label="Sair do sistema"
            tabIndex={0}
            title={collapsed ? 'Sair' : undefined}
          >
            <span className="sidebar__menu-icon">
              <LogoutIcon aria-hidden="true" />
            </span>
            {!collapsed && (
              <span className="sidebar__menu-label">Sair</span>
            )}
            {collapsed && (
              <span className="sr-only">Sair</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;