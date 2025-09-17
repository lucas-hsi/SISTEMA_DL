'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import useScrollDirection from '@/hooks/useScrollDirection';
import { useAuth } from '@/hooks/useAuth';
import { 
  FiSearch, 
  FiBell, 
  FiUser, 
  FiChevronDown,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiSun,
  FiMoon
} from 'react-icons/fi';

interface HeaderProps {
  title?: string;
  className?: string;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

const Header = ({ title = 'Dashboard', className = '', onToggleSidebar, sidebarCollapsed = false }: HeaderProps) => {
  const { theme, setTheme } = useTheme();
  const scrollDirection = useScrollDirection();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 transition-transform duration-300 ease-in-out ${
      scrollDirection === 'down' && scrollY > 200 ? '-translate-y-full' : 'translate-y-0'
    } ${className}`}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section - Menu Toggle and Title */}
        <div className="flex items-center space-x-4">
          {/* Menu Toggle Button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
              title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              <FiMenu className="w-5 h-5" />
            </button>
          )}
          
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Bem-vindo de volta! Aqui está o que está acontecendo hoje.
            </p>
          </div>
        </div>

        {/* Right Section - Search, Notifications, Profile */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              className="block w-64 pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:text-slate-600 dark:focus:text-slate-300 transition-all duration-200"
            title={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
          >
            {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus:text-slate-600 dark:focus:text-slate-300 transition-colors duration-200">
            <FiBell className="h-6 w-6" />
            {/* Notification Badge */}
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-slate-800"></span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700 transition-colors duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full">
                <FiUser className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role || 'Usuário'}</p>
              </div>
              <FiChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                  <FiUser className="w-4 h-4 mr-3" />
                  Meu Perfil
                </button>
                <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                  <FiSettings className="w-4 h-4 mr-3" />
                  Configurações
                </button>
                <hr className="my-1 border-slate-200 dark:border-slate-700" />
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                >
                  <FiLogOut className="w-4 h-4 mr-3" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;