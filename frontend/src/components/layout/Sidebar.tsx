'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  FiHome, 
  FiUsers, 
  FiUser, 
  FiBarChart, 
  FiLogOut,
  FiSettings,
  FiPackage,
  FiShoppingCart,
  FiEdit3,
  FiTrendingUp
} from 'react-icons/fi';

interface SidebarProps {
  className?: string;
  roleDisplayName?: string;
  collapsed?: boolean;
}

const Sidebar = ({ className = '', roleDisplayName, collapsed = false }: SidebarProps) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  const userRole = user?.role || '';

  // Definir menus baseados no perfil
  const getMenuItems = () => {
    switch (userRole) {
      case 'gestor':
        return [
          {
            href: '/gestor/dashboard',
            icon: FiHome,
            label: 'Dashboard',
          },
          {
            href: '/gestor/orcamentos',
            icon: FiTrendingUp,
            label: 'Orçamentos',
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
      case 'vendedor':
        return [
          {
            href: '/vendedor/dashboard',
            icon: FiHome,
            label: 'Dashboard',
          },
          {
            href: '/vendedor/orcamentos',
            icon: FiTrendingUp,
            label: 'Orçamentos',
          },
          {
            href: '/vendedor/estoque',
            icon: FiPackage,
            label: 'Estoque',
          },
          {
            href: '/vendedor/clientes',
            icon: FiUser,
            label: 'Clientes',
          },
          {
            href: '/vendedor/nova-venda',
            icon: FiShoppingCart,
            label: 'Nova Venda',
          },
        ];
      case 'anuncios':
        return [
          {
            href: '/anuncios/dashboard',
            icon: FiHome,
            label: 'Dashboard',
          },
          {
            href: '/anuncios/catalogo',
            icon: FiPackage,
            label: 'Catálogo de Produtos',
          },
          {
            href: '/anuncios/gerar-anuncio',
            icon: FiEdit3,
            label: 'Gerar Anúncio',
          },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={`bg-slate-800 text-white h-full flex flex-col rounded-2xl shadow-2xl border border-slate-600 transition-all duration-300 ${className}`}>
      {/* Logo */}
      <div className={`p-6 border-b border-slate-600 ${collapsed ? 'px-4' : 'px-6'}`}>
        {!collapsed ? (
          <>
            <h1 className="text-xl font-bold text-blue-400">DL Auto Peças</h1>
            <p className="text-sm text-gray-300 mt-1">
              {roleDisplayName ? `Painel ${roleDisplayName}` : 'Painel do Sistema'}
            </p>
          </>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DL</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className={`flex-1 py-6 ${collapsed ? 'px-2' : 'px-4'}`}>
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center rounded-lg transition-all duration-200 group relative
                    ${
                      collapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'
                    }
                    ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-slate-700 hover:text-blue-400'
                    }
                  `}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                  
                  {/* Tooltip para modo recolhido */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className={`border-t border-slate-600 ${collapsed ? 'p-2' : 'p-4'}`}>
        <button
          className={`
            flex items-center rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 w-full group relative
            ${collapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'}
          `}
          title={collapsed ? 'Configurações' : undefined}
        >
          <FiSettings className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && <span className="font-medium">Configurações</span>}
          
          {/* Tooltip para modo recolhido */}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Configurações
            </div>
          )}
        </button>
        
        <button
          onClick={handleLogout}
          className={`
            flex items-center rounded-lg text-gray-300 hover:bg-red-900/20 hover:text-red-400 transition-all duration-200 w-full mt-2 group relative
            ${collapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'}
          `}
          title={collapsed ? 'Sair' : undefined}
        >
          <FiLogOut className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && <span className="font-medium">Sair</span>}
          
          {/* Tooltip para modo recolhido */}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Sair
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;