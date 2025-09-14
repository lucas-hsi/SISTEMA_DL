'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiHome, 
  FiUsers, 
  FiUser, 
  FiBarChart, 
  FiLogOut,
  FiSettings
} from 'react-icons/fi';

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className = '' }: SidebarProps) => {
  const pathname = usePathname();

  const menuItems = [
    {
      href: '/gestor/dashboard',
      icon: FiHome,
      label: 'Dashboard',
    },
    {
      href: '/gestor/equipe',
      icon: FiUsers,
      label: 'Equipe',
    },
    {
      href: '/gestor/clientes',
      icon: FiUser,
      label: 'Clientes',
    },
    {
      href: '/gestor/relatorios',
      icon: FiBarChart,
      label: 'Relatórios',
    },
  ];

  const handleLogout = () => {
    // Limpar todos os dados de autenticação
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('selectedRole');
    window.location.href = '/login';
  };

  return (
    <div className={`bg-gray-900 text-white w-64 min-h-screen flex flex-col ${className}`}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-blue-400">DL Auto Peças</h1>
        <p className="text-sm text-gray-400 mt-1">Painel do Gestor</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center px-4 py-3 rounded-lg transition-colors duration-200
                    ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-700">
        <button
          className="flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200 w-full"
        >
          <FiSettings className="w-5 h-5 mr-3" />
          <span className="font-medium">Configurações</span>
        </button>
        
        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors duration-200 w-full mt-2"
        >
          <FiLogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;