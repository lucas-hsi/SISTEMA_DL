// Componente EmployeeManagement - DL Auto Peças

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  FiUsers,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiDollarSign,
  FiBarChart,
  FiEye
} from 'react-icons/fi';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Modal } from '../common/Modal';
import { useNotification } from '../../contexts/NotificationContext';
import { Employee } from '../../types/manager';

interface EmployeeFilters {
  search: string;
  role: string;
  department: string;
  isActive?: boolean;
}

// ===== TIPOS =====
interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  commissionRate: number;
  discountLimit: number;
  permissions: string[];
  status: 'active' | 'inactive';
}

// ===== STYLED COMPONENTS =====
const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
`;

const FiltersContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
`;

const EmployeeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const EmployeeCard = styled.div<{ isActive?: boolean }>`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s ease;
  opacity: ${props => props.isActive ? 1 : 0.7};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
  }
`;

const EmployeeHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const EmployeeInfo = styled.div`
  flex: 1;
`;

const EmployeeName = styled.h3`
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a202c;
`;

const EmployeeRole = styled.p`
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
`;

const EmployeeContact = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
`;

const StatusBadge = styled.span<{ isActive?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => props.isActive ? '#10b98120' : '#ef444420'};
  color: ${props => props.isActive ? '#10b981' : '#ef4444'};
`;

const EmployeeStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin: 1rem 0;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 0.875rem;
`;

const StatLabel = styled.span`
  color: ${props => props.theme.colors.text.secondary};
`;

const StatValue = styled.span`
  font-weight: 600;
  color: #1a202c;
`;

const PermissionsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const PermissionBadge = styled.span`
  padding: 0.25rem 0.5rem;
  background: #3b82f620;
  color: #3b82f6;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const CardActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const PermissionsSection = styled.div`
  margin-top: 1.5rem;
`;

const PermissionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const PermissionItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e2e8f0;
  }
  
  input {
    margin: 0;
  }
`;

// ===== DADOS MOCK =====
const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@dlauto.com',
    phone: '(11) 99999-9999',
    document: '123.456.789-00',
    position: 'Gerente de Vendas',
    department: 'Vendas',
    status: 'active' as const,
    permissions: {
      maxDiscount: 15,
      accessReports: ['sales', 'financial'],
      canApprove: true,
      canEditPrices: true,
      canAccessFinancial: true,
      canManageInventory: false,
      canViewAllSales: true,
      modules: ['sales', 'reports']
    },
    goals: {
      monthlySalesTarget: 50000,
      quarterlyTarget: 150000,
      yearlyTarget: 600000,
      customGoals: []
    },
    performance: {
      currentMonthSales: 45000,
      lastMonthSales: 42000,
      yearToDateSales: 450000,
      goalAchievement: 90,
      customerSatisfaction: 4.8,
      averageTicket: 1800,
      conversionRate: 25
    },
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@dlauto.com',
    phone: '(11) 88888-8888',
    document: '987.654.321-00',
    position: 'Vendedora',
    department: 'Vendas',
    status: 'active' as const,
    permissions: {
      maxDiscount: 10,
      accessReports: ['sales'],
      canApprove: false,
      canEditPrices: false,
      canAccessFinancial: false,
      canManageInventory: false,
      canViewAllSales: false,
      modules: ['sales']
    },
    goals: {
      monthlySalesTarget: 30000,
      quarterlyTarget: 90000,
      yearlyTarget: 360000,
      customGoals: []
    },
    performance: {
      currentMonthSales: 32000,
      lastMonthSales: 28000,
      yearToDateSales: 320000,
      goalAchievement: 107,
      customerSatisfaction: 4.5,
      averageTicket: 1600,
      conversionRate: 18
    },
    createdAt: new Date('2023-03-20'),
    updatedAt: new Date('2024-01-10'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    email: 'carlos.oliveira@dlauto.com',
    phone: '(11) 77777-7777',
    document: '456.789.123-00',
    position: 'Analista Financeiro',
    department: 'Financeiro',
    status: 'inactive' as const,
    permissions: {
      maxDiscount: 0,
      accessReports: ['financial'],
      canApprove: false,
      canEditPrices: false,
      canAccessFinancial: true,
      canManageInventory: false,
      canViewAllSales: false,
      modules: ['financial']
    },
    goals: {
      monthlySalesTarget: 0,
      quarterlyTarget: 0,
      yearlyTarget: 0,
      customGoals: []
    },
    performance: {
      currentMonthSales: 0,
      lastMonthSales: 0,
      yearToDateSales: 0,
      goalAchievement: 0,
      customerSatisfaction: 0,
      averageTicket: 0,
      conversionRate: 0
    },
    createdAt: new Date('2023-06-10'),
    updatedAt: new Date('2023-12-15'),
    createdBy: 'admin',
    updatedBy: 'admin'
  }
];

const availablePermissions = [
  { id: 'canApprove', label: 'Aprovar Vendas', description: 'Aprovar vendas e orçamentos' },
  { id: 'canEditPrices', label: 'Editar Preços', description: 'Alterar preços de produtos' },
  { id: 'canAccessFinancial', label: 'Ver Financeiro', description: 'Acesso aos dados financeiros' },
  { id: 'canManageInventory', label: 'Gerenciar Estoque', description: 'Controle de estoque' },
  { id: 'canViewAllSales', label: 'Ver Todas as Vendas', description: 'Visualizar vendas de todos os vendedores' }
];

const positionOptions = [
  { value: 'Gerente de Vendas', label: 'Gerente de Vendas' },
  { value: 'Vendedor', label: 'Vendedor' },
  { value: 'Analista Financeiro', label: 'Analista Financeiro' },
  { value: 'Gerente Geral', label: 'Gerente Geral' },
  { value: 'Assistente', label: 'Assistente' }
];

const departmentOptions = [
  { value: 'Vendas', label: 'Vendas' },
  { value: 'Financeiro', label: 'Financeiro' },
  { value: 'Estoque', label: 'Estoque' },
  { value: 'Administrativo', label: 'Administrativo' },
  { value: 'Gerência', label: 'Gerência' }
];

// ===== COMPONENTE =====
export const EmployeeManagement: React.FC = () => {
  const { addNotification } = useNotification();
  
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>(mockEmployees);
  const [filters, setFilters] = useState<EmployeeFilters>({
    search: '',
    role: '',
    department: '',
    isActive: undefined
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: 0,
    commissionRate: 0,
    discountLimit: 0,
    permissions: [],
    status: 'active'
  });
  
  const [loading, setLoading] = useState(false);
  
  // Aplicar filtros
  useEffect(() => {
    let filtered = employees;
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower) ||
        emp.position.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.role) {
      filtered = filtered.filter(emp => emp.position === filters.role);
    }
    
    if (filters.department) {
      filtered = filtered.filter(emp => emp.department === filters.department);
    }
    
    if (filters.isActive !== undefined) {
      filtered = filtered.filter(emp => (emp.status === 'active') === filters.isActive);
    }
    
    setFilteredEmployees(filtered);
  }, [employees, filters]);
  
  const handleFilterChange = (key: keyof EmployeeFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const openModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        department: employee.department,
        salary: 0,
        commissionRate: 0,
        discountLimit: employee.permissions.maxDiscount,
        permissions: [
          ...(employee.permissions.canApprove ? ['canApprove'] : []),
          ...(employee.permissions.canEditPrices ? ['canEditPrices'] : []),
          ...(employee.permissions.canAccessFinancial ? ['canAccessFinancial'] : []),
          ...(employee.permissions.canManageInventory ? ['canManageInventory'] : []),
          ...(employee.permissions.canViewAllSales ? ['canViewAllSales'] : [])
        ],
        status: employee.status
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        salary: 0,
        commissionRate: 0,
        discountLimit: 0,
        permissions: [],
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };
  
  const handleFormChange = (field: keyof EmployeeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validações
      if (!formData.name || !formData.email || !formData.position) {
        addNotification({
          type: 'error',
          title: 'Preencha todos os campos obrigatórios'
        });
        return;
      }
      
      const employeeData: Employee = {
        id: editingEmployee?.id || Date.now().toString(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        document: editingEmployee?.document || '',
        position: formData.position,
        department: formData.department,
        status: formData.status,
        permissions: {
          maxDiscount: formData.discountLimit,
          accessReports: editingEmployee?.permissions.accessReports || [],
          canApprove: formData.permissions.includes('canApprove'),
          canEditPrices: formData.permissions.includes('canEditPrices'),
          canAccessFinancial: formData.permissions.includes('canAccessFinancial'),
          canManageInventory: formData.permissions.includes('canManageInventory'),
          canViewAllSales: formData.permissions.includes('canViewAllSales'),
          modules: editingEmployee?.permissions.modules || []
        },
        goals: editingEmployee?.goals || {
          monthlySalesTarget: 0,
          quarterlyTarget: 0,
          yearlyTarget: 0,
          customGoals: []
        },
        performance: editingEmployee?.performance || {
          currentMonthSales: 0,
          lastMonthSales: 0,
          yearToDateSales: 0,
          goalAchievement: 0,
          customerSatisfaction: 0,
          averageTicket: 0,
          conversionRate: 0
        },
        createdAt: editingEmployee?.createdAt || new Date(),
        updatedAt: new Date(),
        createdBy: editingEmployee?.createdBy || 'admin',
        updatedBy: 'admin'
      };
      
      if (editingEmployee) {
        // Editar funcionário
        setEmployees(prev => prev.map(emp => 
          emp.id === editingEmployee.id ? employeeData : emp
        ));
        addNotification({
          type: 'success',
          title: 'Funcionário atualizado com sucesso!'
        });
      } else {
        // Criar funcionário
        setEmployees(prev => [...prev, employeeData]);
        addNotification({
          type: 'success',
          title: 'Funcionário cadastrado com sucesso!'
        });
      }
      
      closeModal();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro ao salvar funcionário'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (employeeId: string) => {
    try {
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      addNotification({
        type: 'success',
        title: 'Funcionário removido com sucesso!'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro ao remover funcionário'
      });
    }
  };
  
  const toggleEmployeeStatus = async (employeeId: string) => {
    try {
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId 
          ? { ...emp, status: emp.status === 'active' ? 'inactive' : 'active', updatedAt: new Date() }
          : emp
      ));
      addNotification({
        type: 'success',
        title: 'Status do funcionário atualizado!'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro ao atualizar status'
      });
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  return (
    <Container>
      <Header>
        <Title>
          <FiUsers />
          Gestão de Funcionários
        </Title>
        <Button
          onClick={() => openModal()}
          icon={<FiPlus />}
        >
          Novo Funcionário
        </Button>
      </Header>
      
      <FiltersContainer>
        <Input
          placeholder="Buscar funcionários..."
          leftIcon={<FiSearch />}
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        
        <Select
          placeholder="Filtrar por cargo"
          options={positionOptions}
          value={filters.role}
          onChange={(e) => handleFilterChange('role', e.target.value)}
        />
        
        <Select
          placeholder="Filtrar por departamento"
          options={departmentOptions}
          value={filters.department}
          onChange={(e) => handleFilterChange('department', e.target.value)}
        />
        
        <Select
          placeholder="Status"
          options={[
            { value: '', label: 'Todos' },
            { value: 'true', label: 'Ativos' },
            { value: 'false', label: 'Inativos' }
          ]}
          value={filters.isActive?.toString() || ''}
          onChange={(e) => handleFilterChange('isActive', 
            e.target.value === '' ? undefined : e.target.value === 'true'
          )}
        />
      </FiltersContainer>
      
      <EmployeeGrid>
        {filteredEmployees.map(employee => {
          const activePermissions = [
            ...(employee.permissions.canApprove ? ['canApprove'] : []),
            ...(employee.permissions.canEditPrices ? ['canEditPrices'] : []),
            ...(employee.permissions.canAccessFinancial ? ['canAccessFinancial'] : []),
            ...(employee.permissions.canManageInventory ? ['canManageInventory'] : []),
            ...(employee.permissions.canViewAllSales ? ['canViewAllSales'] : [])
          ];
          
          return (
            <EmployeeCard key={employee.id} isActive={employee.status === 'active'}>
              <EmployeeHeader>
                <EmployeeInfo>
                  <EmployeeName>{employee.name}</EmployeeName>
                  <EmployeeRole>{employee.position}</EmployeeRole>
                  <EmployeeContact>{employee.email}</EmployeeContact>
                  <EmployeeContact>{employee.phone}</EmployeeContact>
                </EmployeeInfo>
                <StatusBadge isActive={employee.status === 'active'}>
                  {employee.status === 'active' ? <FiUserCheck /> : <FiUserX />}
                  {employee.status === 'active' ? 'Ativo' : 'Inativo'}
                </StatusBadge>
              </EmployeeHeader>
              
              <EmployeeStats>
                <StatItem>
                  <FiDollarSign size={16} />
                  <StatLabel>Meta Mensal:</StatLabel>
                  <StatValue>{formatCurrency(employee.goals.monthlySalesTarget)}</StatValue>
                </StatItem>
                <StatItem>
                  <FiBarChart size={16} />
                  <StatLabel>Performance:</StatLabel>
                  <StatValue>{employee.performance.goalAchievement}%</StatValue>
                </StatItem>
                <StatItem>
                  <FiShield size={16} />
                  <StatLabel>Desc. Máx:</StatLabel>
                  <StatValue>{employee.permissions.maxDiscount}%</StatValue>
                </StatItem>
                <StatItem>
                  <FiEye size={16} />
                  <StatLabel>Permissões:</StatLabel>
                  <StatValue>{activePermissions.length}</StatValue>
                </StatItem>
              </EmployeeStats>
              
              <PermissionsList>
                {activePermissions.slice(0, 3).map(permission => {
                  const permissionInfo = availablePermissions.find(p => p.id === permission);
                  return (
                    <PermissionBadge key={permission}>
                      {permissionInfo?.label || permission}
                    </PermissionBadge>
                  );
                })}
                {activePermissions.length > 3 && (
                  <PermissionBadge>
                    +{activePermissions.length - 3} mais
                  </PermissionBadge>
                )}
              </PermissionsList>
              
              <CardActions>
                <Button
                  size="small"
                  variant="secondary"
                  icon={<FiEdit3 />}
                  onClick={() => openModal(employee)}
                >
                  Editar
                </Button>
                <Button
                  size="small"
                  variant={employee.status === 'active' ? 'warning' : 'success'}
                  onClick={() => toggleEmployeeStatus(employee.id)}
                >
                  {employee.status === 'active' ? 'Desativar' : 'Ativar'}
                </Button>
                <Button
                  size="small"
                  variant="error"
                  icon={<FiTrash2 />}
                  onClick={() => handleDelete(employee.id)}
                >
                  Excluir
                </Button>
              </CardActions>
            </EmployeeCard>
          );
        })}
      </EmployeeGrid>
      
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
        size="large"
        loading={loading}
        footer={
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave} loading={loading}>
              {editingEmployee ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        }
      >
        <FormGrid>
          <Input
            label="Nome Completo *"
            value={formData.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            placeholder="Digite o nome completo"
          />
          
          <Input
            label="E-mail *"
            type="email"
            value={formData.email}
            onChange={(e) => handleFormChange('email', e.target.value)}
            placeholder="Digite o e-mail"
          />
          
          <Input
            label="Telefone"
            value={formData.phone}
            onChange={(e) => handleFormChange('phone', e.target.value)}
            placeholder="(11) 99999-9999"
          />
          
          <Select
            label="Cargo *"
            options={positionOptions}
            value={formData.position}
            onChange={(e) => handleFormChange('position', e.target.value)}
            placeholder="Selecione o cargo"
          />
          
          <Select
            label="Departamento *"
            options={departmentOptions}
            value={formData.department}
            onChange={(e) => handleFormChange('department', e.target.value)}
            placeholder="Selecione o departamento"
          />
          
          <Input
            label="Salário (R$)"
            type="number"
            value={formData.salary}
            onChange={(e) => handleFormChange('salary', Number(e.target.value))}
            placeholder="0,00"
          />
          
          <Input
            label="Taxa de Comissão (%)"
            type="number"
            value={formData.commissionRate}
            onChange={(e) => handleFormChange('commissionRate', Number(e.target.value))}
            placeholder="0"
          />
          
          <Input
            label="Limite de Desconto (%)"
            type="number"
            value={formData.discountLimit}
            onChange={(e) => handleFormChange('discountLimit', Number(e.target.value))}
            placeholder="0"
          />
        </FormGrid>
        
        <PermissionsSection>
          <h3>Permissões do Sistema</h3>
          <PermissionsGrid>
            {availablePermissions.map(permission => (
              <PermissionItem key={permission.id}>
                <input
                  type="checkbox"
                  checked={formData.permissions.includes(permission.id)}
                  onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                />
                <div>
                  <div style={{ fontWeight: 500 }}>{permission.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>
                    {permission.description}
                  </div>
                </div>
              </PermissionItem>
            ))}
          </PermissionsGrid>
        </PermissionsSection>
      </Modal>
    </Container>
  );
};

export default EmployeeManagement;