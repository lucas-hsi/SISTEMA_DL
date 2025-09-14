'use client';

import { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiBell, 
  FiUser, 
  FiChevronDown,
  FiSettings,
  FiLogOut
} from 'react-icons/fi';

interface HeaderProps {
  title?: string;
  className?: string;
}

const Header = ({ title = 'Dashboard', className = '' }: HeaderProps) => {
  const [userProfile, setUserProfile] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Priorizar selectedRole, mas manter compatibilidade com userProfile
      const selectedRole = localStorage.getItem('selectedRole');
      const userProfile = localStorage.getItem('userProfile');
      const profile = selectedRole || userProfile || 'Gestor';
      setUserProfile(profile);
    }
  }, []);

  const handleLogout = () => {
    // Limpar todos os dados de autenticação
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('selectedRole');
    window.location.href = '/login';
  };

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section - Title and Welcome */}
        <div className="flex items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600 mt-1">
              Bem-vindo de volta! Aqui está o que está acontecendo hoje.
            </p>
          </div>
        </div>

        {/* Right Section - Search, Notifications, Profile */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200">
            <FiBell className="h-6 w-6" />
            {/* Notification Badge */}
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full">
                <FiUser className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{userProfile}</p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
              <FiChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                  <FiUser className="w-4 h-4 mr-3" />
                  Meu Perfil
                </button>
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                  <FiSettings className="w-4 h-4 mr-3" />
                  Configurações
                </button>
                <hr className="my-1 border-gray-200" />
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
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