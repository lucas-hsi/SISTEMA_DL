// Página ManagerDashboard - DL Auto Peças

import React, { useState } from 'react';
import styled from 'styled-components';
import {
  FiHome,
  FiBarChart3,
  FiPackage,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiGitBranch,
  FiMenu,
  FiX,
  FiSettings,
  FiLogOut,
  FiBell,
  FiUser
} from 'react-icons/fi';
import {
  ExecutiveDashboard,
  ScrapManagement,
  EmployeeManagement,
  SmartCalendar,
  FinancialControl,
  StrategicReports,
  WorkflowManagement
} from '../components/manager';
import { useAuth } from '../hooks';
import { useNotification } from '../contexts/NotificationContext';

// ===== TIPOS =====
type ActiveSection = 
  | 'dashboard'
  | 'scraps'
  | 'employees'
  | 'calendar'
  | 'financial'
  | 'reports'
  | 'workflows';

interface MenuItem {
  id: ActiveSection;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// ===== STYLED COMPONENTS =====
const Container = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
`;

const Sidebar = styled.aside<{ isOpen: boolean }>`
  width: ${props => props.isOpen ? '280px' : '80px'};
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  position: fixed;
  height: 100vh;
  z-index: 1000;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    width: ${props => props.isOpen ? '100%' : '0'};
    transform: translateX(${props => props.isOpen ? '0' : '-100%'});
  }
`;

const SidebarHeader = styled.div<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${props => props.isOpen ? 'space-between' : 'center'};
  padding: 1.5rem ${props => props.isOpen ? '1.5rem' : '1rem'};
  border-bottom: 1px solid #e5e7eb;
`;

const Logo = styled.div<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #3b82f6;
  
  ${props => !props.isOpen && `
    span {
      display: none;
    }
  `}
`;

const MenuToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
    color: #3b82f6;
  }
`;

const Navigation = styled.nav`
  padding: 1rem 0;
`;

const MenuItem = styled.button<{ active?: boolean; isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem ${props => props.isOpen ? '1.5rem' : '1rem'};
  border: none;
  background: ${props => props.active ? '#3b82f615' : 'transparent'};
  color: ${props => props.active ? '#3b82f6' : '#6b7280'};
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  
  &:hover {
    background: ${props => props.active ? '#3b82f620' : '#f3f4f6'};
    color: #3b82f6;
  }
  
  ${props => !props.isOpen && `
    justify-content: center;
    
    span {
      display: none;
    }
  `}
`;

const MenuIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
`;

const MainContent = styled.main<{ sidebarOpen: boolean }>`
  flex: 1;
  margin-left: ${props => props.sidebarOpen ? '280px' : '80px'};
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const MobileMenuToggle = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
    color: #3b82f6;
  }
  
  @media (max-width: 768px) {
    display: flex;
  }
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
`;

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const NotificationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: #f3f4f6;
    color: #3b82f6;
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const UserAvatar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.875rem;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const UserName = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1a1a;
`;

const UserRole = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const ContentArea = styled.div`
  min-height: calc(100vh - 80px);
`;

const SidebarFooter = styled.div<{ isOpen: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem ${props => props.isOpen ? '1.5rem' : '1rem'};
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
`;

const LogoutButton = styled.button<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 0;
  border: none;
  background: transparent;
  color: #ef4444;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  
  &:hover {
    background: #fef2f2;
  }
  
  ${props => !props.isOpen && `
    justify-content: center;
    
    span {
      display: none;
    }
  `}
`;

// ===== DADOS =====
const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard Executivo',
    icon: <FiHome />,
    description: 'Visão geral e KPIs'
  },
  {
    id: 'scraps',
    label: 'Gestão de Sucatas',
    icon: <FiPackage />,
    description: 'Compra e desmanche'
  },
  {
    id: 'employees',
    label: 'Funcionários',
    icon: <FiUsers />,
    description: 'Gestão de equipe'
  },
  {
    id: 'calendar',
    label: 'Calendário',
    icon: <FiCalendar />,
    description: 'Agenda e tarefas'
  },
  {
    id: 'financial',
    label: 'Financeiro',
    icon: <FiDollarSign />,
    description: 'Contas e pagamentos'
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: <FiFileText />,
    description: 'Análises estratégicas'
  },
  {
    id: 'workflows',
    label: 'Fluxos de Trabalho',
    icon: <FiGitBranch />,
    description: 'Aprovações e processos'
  }
];

// ===== COMPONENTE =====
export const ManagerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { addNotification } = useNotification();
  
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleMenuClick = (sectionId: ActiveSection) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      addNotification({ type: 'success', title: 'Logout realizado com sucesso!' });
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };
  
  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.id === activeSection);
    return currentItem?.label || 'Dashboard';
  };
  
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <ExecutiveDashboard />;
      case 'scraps':
        return <ScrapManagement />;
      case 'employees':
        return <EmployeeManagement />;
      case 'calendar':
        return <SmartCalendar />;
      case 'financial':
        return <FinancialControl />;
      case 'reports':
        return <StrategicReports />;
      case 'workflows':
        return <WorkflowManagement />;
      default:
        return <ExecutiveDashboard />;
    }
  };
  
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  return (
    <Container>
      <Sidebar isOpen={sidebarOpen || mobileMenuOpen}>
        <SidebarHeader isOpen={sidebarOpen || mobileMenuOpen}>
          <Logo isOpen={sidebarOpen || mobileMenuOpen}>
            <FiSettings />
            <span>DL Manager</span>
          </Logo>
          <MenuToggle onClick={toggleSidebar}>
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </MenuToggle>
        </SidebarHeader>
        
        <Navigation>
          {menuItems.map(item => (
            <MenuItem
              key={item.id}
              active={activeSection === item.id}
              isOpen={sidebarOpen || mobileMenuOpen}
              onClick={() => handleMenuClick(item.id)}
              title={!sidebarOpen ? item.label : undefined}
            >
              <MenuIcon>{item.icon}</MenuIcon>
              <span>{item.label}</span>
            </MenuItem>
          ))}
        </Navigation>
        
        <SidebarFooter isOpen={sidebarOpen || mobileMenuOpen}>
          <LogoutButton 
            isOpen={sidebarOpen || mobileMenuOpen}
            onClick={handleLogout}
            title={!sidebarOpen ? 'Sair' : undefined}
          >
            <FiLogOut />
            <span>Sair</span>
          </LogoutButton>
        </SidebarFooter>
      </Sidebar>
      
      <MainContent sidebarOpen={sidebarOpen}>
        <TopBar>
          <TopBarLeft>
            <MobileMenuToggle onClick={toggleMobileMenu}>
              <FiMenu />
            </MobileMenuToggle>
            <PageTitle>{getCurrentPageTitle()}</PageTitle>
          </TopBarLeft>
          
          <TopBarRight>
            <NotificationButton>
              <FiBell />
              <NotificationBadge />
            </NotificationButton>
            
            <UserMenu>
              <UserAvatar>
                {getUserInitials()}
              </UserAvatar>
              <UserInfo>
                <UserName>{user?.name || 'Usuário'}</UserName>
                <UserRole>Gestor</UserRole>
              </UserInfo>
            </UserMenu>
          </TopBarRight>
        </TopBar>
        
        <ContentArea>
          {renderContent()}
        </ContentArea>
      </MainContent>
    </Container>
  );
};

export default ManagerDashboard;