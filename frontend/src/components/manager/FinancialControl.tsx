// Componente FinancialControl - DL Auto Peças

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  FiDollarSign,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiUpload,
  FiDownload,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiFile,
  FiEye
} from 'react-icons/fi';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Modal } from '../common/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import { FinancialAccount, AccountType, AccountStatus, FinancialFilters } from '../../types/manager';

// ===== TIPOS =====
interface AccountFormData {
  title: string;
  description: string;
  type: AccountType;
  amount: number;
  dueDate: string;
  category: string;
  supplier: string;
  customer: string;
  paymentMethod: string;
  installments: number;
  currentInstallment: number;
  status: AccountStatus;
  attachments: File[];
}

interface FinancialSummary {
  totalReceivable: number;
  totalPayable: number;
  overdue: number;
  paidThisMonth: number;
  receivedThisMonth: number;
  balance: number;
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
  color: #1a1a1a;
  margin: 0;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const SummaryCard = styled.div<{ variant?: 'success' | 'warning' | 'error' | 'info' }>`
  background: #f9fafb;
  border: 1px solid ${props => {
    switch (props.variant) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#e5e7eb';
    }
  }};
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const SummaryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const SummaryIcon = styled.div<{ variant?: 'success' | 'warning' | 'error' | 'info' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => {
    switch (props.variant) {
      case 'success': return '#10b98120';
      case 'warning': return '#f59e0b20';
      case 'error': return '#ef444420';
      default: return '#3b82f620';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#3b82f6';
    }
  }};
`;

const SummaryTitle = styled.h3`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SummaryValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
`;

const SummaryChange = styled.div<{ positive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: ${props => props.positive ? '#10b981' : '#ef4444'};
`;

const FiltersContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
`;

const AccountsTable = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 120px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TableRow = styled.div<{ overdue?: boolean }>`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 120px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  
  ${props => props.overdue && `
    background: #fef2f2;
    border-left: 4px solid #ef4444;
  `}
  
  &:hover {
    background: #f9fafb;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #1a1a1a;
`;

const AccountTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const AccountDescription = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const StatusBadge = styled.span<{ status: AccountStatus }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 'paid':
        return `
          background: #10b98120;
          color: #10b981;
        `;
      case 'overdue':
        return `
          background: #ef444420;
          color: #ef4444;
        `;
      case 'pending':
        return `
          background: #f59e0b20;
          color: #f59e0b;
        `;
      default:
        return `
          background: #3b82f620;
          color: #3b82f6;
        `;
    }
  }}
`;

const TypeBadge = styled.span<{ type: AccountType }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    if (props.type === 'receivable') {
      return `
        background: #10b98120;
        color: #10b981;
      `;
    } else {
      return `
        background: #ef444420;
        color: #ef4444;
      `;
    }
  }}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const AttachmentsSection = styled.div`
  margin-top: 1.5rem;
`;

const AttachmentsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const AttachmentItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.875rem;
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: #2563eb;
  }
`;

// ===== DADOS MOCK =====
const mockAccounts: FinancialAccount[] = [
  {
    id: '1',
    title: 'Fornecedor ABC Ltda',
    description: 'Compra de peças automotivas',
    type: 'payable',
    amount: 15000,
    dueDate: new Date('2024-01-25'),
    category: 'Fornecedores',
    supplier: 'ABC Ltda',
    customer: '',
    paymentMethod: 'Boleto',
    installments: 1,
    currentInstallment: 1,
    status: 'pending',
    attachments: ['boleto_abc.pdf'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: '2',
    title: 'Venda Cliente XYZ',
    description: 'Venda de motor usado',
    type: 'receivable',
    amount: 8500,
    dueDate: new Date('2024-01-30'),
    category: 'Vendas',
    supplier: '',
    customer: 'João Silva',
    paymentMethod: 'PIX',
    installments: 3,
    currentInstallment: 1,
    status: 'paid',
    attachments: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '3',
    title: 'Aluguel Galpão',
    description: 'Aluguel mensal do galpão',
    type: 'payable',
    amount: 5000,
    dueDate: new Date('2024-01-10'),
    category: 'Despesas Fixas',
    supplier: 'Imobiliária Santos',
    customer: '',
    paymentMethod: 'Transferência',
    installments: 1,
    currentInstallment: 1,
    status: 'overdue',
    attachments: ['contrato_aluguel.pdf'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

const categoryOptions = [
  { value: 'Fornecedores', label: 'Fornecedores' },
  { value: 'Vendas', label: 'Vendas' },
  { value: 'Despesas Fixas', label: 'Despesas Fixas' },
  { value: 'Despesas Variáveis', label: 'Despesas Variáveis' },
  { value: 'Impostos', label: 'Impostos' },
  { value: 'Outros', label: 'Outros' }
];

const paymentMethodOptions = [
  { value: 'Boleto', label: 'Boleto' },
  { value: 'PIX', label: 'PIX' },
  { value: 'Transferência', label: 'Transferência' },
  { value: 'Cartão', label: 'Cartão' },
  { value: 'Dinheiro', label: 'Dinheiro' },
  { value: 'Cheque', label: 'Cheque' }
];

const statusOptions = [
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'overdue', label: 'Vencido' },
  { value: 'cancelled', label: 'Cancelado' }
];

// ===== COMPONENTE =====
export const FinancialControl: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  
  const [accounts, setAccounts] = useState<FinancialAccount[]>(mockAccounts);
  const [filteredAccounts, setFilteredAccounts] = useState<FinancialAccount[]>(mockAccounts);
  const [filters, setFilters] = useState<FinancialFilters>({
    search: '',
    type: undefined,
    status: undefined,
    category: '',
    dateFrom: '',
    dateTo: ''
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [formData, setFormData] = useState<AccountFormData>({
    title: '',
    description: '',
    type: 'payable',
    amount: 0,
    dueDate: '',
    category: '',
    supplier: '',
    customer: '',
    paymentMethod: '',
    installments: 1,
    currentInstallment: 1,
    status: 'pending',
    attachments: []
  });
  
  const [loading, setLoading] = useState(false);
  
  // Calcular resumo financeiro
  const summary: FinancialSummary = React.useMemo(() => {
    const totalReceivable = accounts
      .filter(acc => acc.type === 'receivable' && acc.status !== 'cancelled')
      .reduce((sum, acc) => sum + acc.amount, 0);
    
    const totalPayable = accounts
      .filter(acc => acc.type === 'payable' && acc.status !== 'cancelled')
      .reduce((sum, acc) => sum + acc.amount, 0);
    
    const overdue = accounts
      .filter(acc => acc.status === 'overdue')
      .reduce((sum, acc) => sum + acc.amount, 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const paidThisMonth = accounts
      .filter(acc => {
        const paidDate = new Date(acc.updatedAt);
        return acc.status === 'paid' && 
               acc.type === 'payable' &&
               paidDate.getMonth() === currentMonth &&
               paidDate.getFullYear() === currentYear;
      })
      .reduce((sum, acc) => sum + acc.amount, 0);
    
    const receivedThisMonth = accounts
      .filter(acc => {
        const receivedDate = new Date(acc.updatedAt);
        return acc.status === 'paid' && 
               acc.type === 'receivable' &&
               receivedDate.getMonth() === currentMonth &&
               receivedDate.getFullYear() === currentYear;
      })
      .reduce((sum, acc) => sum + acc.amount, 0);
    
    const balance = totalReceivable - totalPayable;
    
    return {
      totalReceivable,
      totalPayable,
      overdue,
      paidThisMonth,
      receivedThisMonth,
      balance
    };
  }, [accounts]);
  
  // Aplicar filtros
  useEffect(() => {
    let filtered = accounts;
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(acc => 
        acc.title.toLowerCase().includes(searchLower) ||
        acc.description.toLowerCase().includes(searchLower) ||
        acc.supplier.toLowerCase().includes(searchLower) ||
        acc.customer.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.type) {
      filtered = filtered.filter(acc => acc.type === filters.type);
    }
    
    if (filters.status) {
      filtered = filtered.filter(acc => acc.status === filters.status);
    }
    
    if (filters.category) {
      filtered = filtered.filter(acc => acc.category === filters.category);
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(acc => new Date(acc.dueDate) >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter(acc => new Date(acc.dueDate) <= toDate);
    }
    
    setFilteredAccounts(filtered);
  }, [accounts, filters]);
  
  const handleFilterChange = (key: keyof FinancialFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const openModal = (account?: FinancialAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        title: account.title,
        description: account.description,
        type: account.type,
        amount: account.amount,
        dueDate: account.dueDate.toISOString().split('T')[0],
        category: account.category,
        supplier: account.supplier,
        customer: account.customer,
        paymentMethod: account.paymentMethod,
        installments: account.installments,
        currentInstallment: account.currentInstallment,
        status: account.status,
        attachments: []
      });
    } else {
      setEditingAccount(null);
      setFormData({
        title: '',
        description: '',
        type: 'payable',
        amount: 0,
        dueDate: '',
        category: '',
        supplier: '',
        customer: '',
        paymentMethod: '',
        installments: 1,
        currentInstallment: 1,
        status: 'pending',
        attachments: []
      });
    }
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };
  
  const handleFormChange = (field: keyof AccountFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
  };
  
  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      
      if (!formData.title || !formData.amount || !formData.dueDate) {
        addNotification({ type: 'error', title: 'Preencha os campos obrigatórios' });
        return;
      }
      
      const accountData: FinancialAccount = {
        id: editingAccount?.id || Date.now().toString(),
        ...formData,
        dueDate: new Date(formData.dueDate),
        attachments: formData.attachments.map(file => file.name),
        createdAt: editingAccount?.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      if (editingAccount) {
        setAccounts(prev => prev.map(acc => 
          acc.id === editingAccount.id ? accountData : acc
        ));
        addNotification({ type: 'success', title: 'Conta atualizada com sucesso!' });
      } else {
        setAccounts(prev => [...prev, accountData]);
        addNotification({ type: 'success', title: 'Conta cadastrada com sucesso!' });
      }
      
      closeModal();
    } catch (error) {
      addNotification({ type: 'error', title: 'Erro ao salvar conta' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (accountId: string) => {
    try {
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      addNotification({ type: 'success', title: 'Conta removida com sucesso!' });
    } catch (error) {
      addNotification({ type: 'error', title: 'Erro ao remover conta' });
    }
  };
  
  const markAsPaid = async (accountId: string) => {
    try {
      setAccounts(prev => prev.map(acc => 
        acc.id === accountId 
          ? { ...acc, status: 'paid' as AccountStatus, updatedAt: new Date() }
          : acc
      ));
      addNotification({ type: 'success', title: 'Conta marcada como paga!' });
    } catch (error) {
      addNotification({ type: 'error', title: 'Erro ao atualizar status' });
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };
  
  const isOverdue = (account: FinancialAccount) => {
    return account.status === 'overdue' || 
           (account.status === 'pending' && new Date(account.dueDate) < new Date());
  };
  
  const getStatusLabel = (status: AccountStatus) => {
    const labels = {
      pending: 'Pendente',
      paid: 'Pago',
      overdue: 'Vencido',
      cancelled: 'Cancelado'
    };
    return labels[status];
  };
  
  const getStatusIcon = (status: AccountStatus) => {
    switch (status) {
      case 'paid': return <FiCheckCircle />;
      case 'overdue': return <FiAlertCircle />;
      case 'pending': return <FiClock />;
      default: return <FiClock />;
    }
  };
  
  return (
    <Container>
      <Header>
        <Title>
          <FiDollarSign />
          Controle Financeiro
        </Title>
        <Button
          onClick={() => openModal()}
          icon={<FiPlus />}
        >
          Nova Conta
        </Button>
      </Header>
      
      <SummaryGrid>
        <SummaryCard variant="success">
          <SummaryHeader>
            <SummaryTitle>A Receber</SummaryTitle>
            <SummaryIcon variant="success">
              <FiTrendingUp />
            </SummaryIcon>
          </SummaryHeader>
          <SummaryValue>{formatCurrency(summary.totalReceivable)}</SummaryValue>
          <SummaryChange positive>
            <FiTrendingUp size={14} />
            Recebido este mês: {formatCurrency(summary.receivedThisMonth)}
          </SummaryChange>
        </SummaryCard>
        
        <SummaryCard variant="error">
          <SummaryHeader>
            <SummaryTitle>A Pagar</SummaryTitle>
            <SummaryIcon variant="error">
              <FiTrendingDown />
            </SummaryIcon>
          </SummaryHeader>
          <SummaryValue>{formatCurrency(summary.totalPayable)}</SummaryValue>
          <SummaryChange>
            <FiTrendingDown size={14} />
            Pago este mês: {formatCurrency(summary.paidThisMonth)}
          </SummaryChange>
        </SummaryCard>
        
        <SummaryCard variant="warning">
          <SummaryHeader>
            <SummaryTitle>Em Atraso</SummaryTitle>
            <SummaryIcon variant="warning">
              <FiAlertCircle />
            </SummaryIcon>
          </SummaryHeader>
          <SummaryValue>{formatCurrency(summary.overdue)}</SummaryValue>
          <SummaryChange>
            <FiAlertCircle size={14} />
            Requer atenção
          </SummaryChange>
        </SummaryCard>
        
        <SummaryCard variant={summary.balance >= 0 ? 'success' : 'error'}>
          <SummaryHeader>
            <SummaryTitle>Saldo</SummaryTitle>
            <SummaryIcon variant={summary.balance >= 0 ? 'success' : 'error'}>
              {summary.balance >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
            </SummaryIcon>
          </SummaryHeader>
          <SummaryValue>{formatCurrency(summary.balance)}</SummaryValue>
          <SummaryChange positive={summary.balance >= 0}>
            {summary.balance >= 0 ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
            {summary.balance >= 0 ? 'Positivo' : 'Negativo'}
          </SummaryChange>
        </SummaryCard>
      </SummaryGrid>
      
      <FiltersContainer>
        <Input
          placeholder="Buscar contas..."
          leftIcon={<FiSearch />}
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        
        <Select
          placeholder="Tipo"
          options={[
            { value: '', label: 'Todos os tipos' },
            { value: 'receivable', label: 'A Receber' },
            { value: 'payable', label: 'A Pagar' }
          ]}
          value={filters.type || ''}
          onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
        />
        
        <Select
          placeholder="Status"
          options={[{ value: '', label: 'Todos os status' }, ...statusOptions]}
          value={filters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
        />
        
        <Select
          placeholder="Categoria"
          options={[{ value: '', label: 'Todas as categorias' }, ...categoryOptions]}
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        />
        
        <Input
          label="Data Inicial"
          type="date"
          value={filters.dateFrom}
          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
        />
        
        <Input
          label="Data Final"
          type="date"
          value={filters.dateTo}
          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
        />
      </FiltersContainer>
      
      <AccountsTable>
        <TableHeader>
          <div>Conta</div>
          <div>Tipo</div>
          <div>Valor</div>
          <div>Vencimento</div>
          <div>Status</div>
          <div>Categoria</div>
          <div>Ações</div>
        </TableHeader>
        
        {filteredAccounts.map(account => (
          <TableRow key={account.id} overdue={isOverdue(account)}>
            <TableCell>
              <div>
                <AccountTitle>{account.title}</AccountTitle>
                <AccountDescription>{account.description}</AccountDescription>
              </div>
            </TableCell>
            
            <TableCell>
              <TypeBadge type={account.type}>
                {account.type === 'receivable' ? <FiTrendingUp /> : <FiTrendingDown />}
                {account.type === 'receivable' ? 'Receber' : 'Pagar'}
              </TypeBadge>
            </TableCell>
            
            <TableCell>
              <strong>{formatCurrency(account.amount)}</strong>
            </TableCell>
            
            <TableCell>
              {formatDate(account.dueDate)}
            </TableCell>
            
            <TableCell>
              <StatusBadge status={account.status}>
                {getStatusIcon(account.status)}
                {getStatusLabel(account.status)}
              </StatusBadge>
            </TableCell>
            
            <TableCell>
              {account.category}
            </TableCell>
            
            <TableCell>
              <ActionButtons>
                {account.status === 'pending' && (
                  <Button
                    size="small"
                    variant="success"
                    onClick={() => markAsPaid(account.id)}
                  >
                    <FiCheckCircle size={14} />
                  </Button>
                )}
                
                <Button
                  size="small"
                  variant="secondary"
                  icon={<FiEdit3 />}
                  onClick={() => openModal(account)}
                />
                
                <Button
                  size="small"
                  variant="error"
                  icon={<FiTrash2 />}
                  onClick={() => handleDelete(account.id)}
                />
              </ActionButtons>
            </TableCell>
          </TableRow>
        ))}
      </AccountsTable>
      
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAccount ? 'Editar Conta' : 'Nova Conta'}
        size="large"
        loading={loading}
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : editingAccount ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        }
      >
        <FormGrid>
          <Input
            label="Título *"
            value={formData.title}
            onChange={(e) => handleFormChange('title', e.target.value)}
            placeholder="Digite o título da conta"
          />
          
          <Select
            label="Tipo *"
            options={[
              { value: 'receivable', label: 'A Receber' },
              { value: 'payable', label: 'A Pagar' }
            ]}
            value={formData.type}
            onChange={(e) => handleFormChange('type', e.target.value)}
          />
          
          <Input
            label="Valor (R$) *"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => handleFormChange('amount', Number(e.target.value))}
            placeholder="0,00"
          />
          
          <Input
            label="Data de Vencimento *"
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleFormChange('dueDate', e.target.value)}
          />
          
          <Select
            label="Categoria"
            options={categoryOptions}
            value={formData.category}
            onChange={(e) => handleFormChange('category', e.target.value)}
            placeholder="Selecione a categoria"
          />
          
          <Select
            label="Método de Pagamento"
            options={paymentMethodOptions}
            value={formData.paymentMethod}
            onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
            placeholder="Selecione o método"
          />
          
          {formData.type === 'payable' && (
            <Input
              label="Fornecedor"
              value={formData.supplier}
              onChange={(e) => handleFormChange('supplier', e.target.value)}
              placeholder="Nome do fornecedor"
            />
          )}
          
          {formData.type === 'receivable' && (
            <Input
              label="Cliente"
              value={formData.customer}
              onChange={(e) => handleFormChange('customer', e.target.value)}
              placeholder="Nome do cliente"
            />
          )}
          
          <Input
            label="Parcelas"
            type="number"
            value={formData.installments}
            onChange={(e) => handleFormChange('installments', Number(e.target.value))}
            placeholder="1"
          />
          
          <Select
            label="Status"
            options={statusOptions}
            value={formData.status}
            onChange={(e) => handleFormChange('status', e.target.value)}
          />
        </FormGrid>
        
        <Input
          label="Descrição"
          value={formData.description}
          onChange={(e) => handleFormChange('description', e.target.value)}
          placeholder="Digite uma descrição detalhada"
        />
        
        <AttachmentsSection>
          <h3>Anexos</h3>
          <UploadButton>
            <FiUpload />
            Adicionar Arquivos
            <FileInput
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileUpload}
            />
          </UploadButton>
          
          {formData.attachments.length > 0 && (
            <AttachmentsList>
              {formData.attachments.map((file, index) => (
                <AttachmentItem key={index}>
                  <FiFile />
                  {file.name}
                  <Button
                    size="small"
                    variant="ghost"
                    onClick={() => removeAttachment(index)}
                  >
                    <FiTrash2 size={14} />
                  </Button>
                </AttachmentItem>
              ))}
            </AttachmentsList>
          )}
        </AttachmentsSection>
      </Modal>
    </Container>
  );
};

export default FinancialControl;