// Dashboard Executivo - DL Auto Peças

import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDollarSign, 
  FiUsers, 
  FiPackage, 
  FiAlertTriangle,
  FiFilter,
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';
import { KPICard, DashboardFilters, SalesData, PerformanceAlert } from '../../types/manager';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';

// ===== STYLED COMPONENTS =====
const DashboardContainer = styled.div`
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h1 {
    color: #1f2937;
    font-size: 2rem;
    font-weight: 600;
    margin: 0;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  &.secondary {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    
    &:hover {
      background: #f9fafb;
    }
  }
`;

const FiltersContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    font-weight: 500;
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  select, input {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    color: #374151;
    font-size: 0.875rem;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
`;

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const KPICardContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const KPIHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  h3 {
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const KPIIcon = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${props => props.color}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color};
  font-size: 1.25rem;
`;

const KPIValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
`;

const KPIChange = styled.div<{ positive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: ${props => props.positive ? '#10b981' : '#ef4444'};
  font-weight: 500;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  
  h3 {
    color: #111827;
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
  }
`;

const AlertsContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  
  h3 {
    color: #111827;
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const AlertItem = styled.div<{ severity: 'low' | 'medium' | 'high' }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: ${props => {
    switch (props.severity) {
      case 'high': return 'rgba(239, 68, 68, 0.1)';
      case 'medium': return 'rgba(245, 158, 11, 0.1)';
      default: return 'rgba(59, 130, 246, 0.1)';
    }
  }};
  border-left: 4px solid ${props => {
    switch (props.severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#3b82f6';
    }
  }};
  
  .alert-content {
    flex: 1;
    
    .alert-title {
      font-weight: 500;
      color: #111827;
      margin-bottom: 0.25rem;
    }
    
    .alert-description {
      font-size: 0.875rem;
      color: #6b7280;
    }
  }
`;

// ===== DADOS MOCK =====
const mockKPIs: KPICard[] = [
  {
    id: '1',
    title: 'Vendas Totais',
    value: 'R$ 125.430',
    change: 12.5,
    changeType: 'increase',
    icon: 'dollar-sign',
    color: '#10B981',
    period: 'month'
  },
  {
    id: '2',
    title: 'Margem de Lucro',
    value: '23.8%',
    change: -2.1,
    changeType: 'decrease',
    icon: 'trending-up',
    color: '#F59E0B',
    period: 'month'
  },
  {
    id: '3',
    title: 'Inadimplência',
    value: '4.2%',
    change: -0.8,
    changeType: 'decrease',
    icon: 'alert-triangle',
    color: '#EF4444',
    period: 'month'
  },
  {
    id: '4',
    title: 'Estoque Atual',
    value: '2.847',
    change: 156,
    changeType: 'increase',
    icon: 'package',
    color: '#3B82F6',
    period: 'current'
  },
  {
    id: '5',
    title: 'Vendedores Ativos',
    value: '24',
    change: 3,
    changeType: 'increase',
    icon: 'users',
    color: '#8B5CF6',
    period: 'current'
  }
];

const mockSalesData = [
  { month: 'Jan', vendas: 45000, meta: 50000 },
  { month: 'Fev', vendas: 52000, meta: 50000 },
  { month: 'Mar', vendas: 48000, meta: 50000 },
  { month: 'Abr', vendas: 61000, meta: 55000 },
  { month: 'Mai', vendas: 55000, meta: 55000 },
  { month: 'Jun', vendas: 67000, meta: 60000 }
];

const mockChannelData = [
  { name: 'Marketplace', value: 45, color: '#10B981' },
  { name: 'Loja Física', value: 30, color: '#3B82F6' },
  { name: 'Vendedores', value: 20, color: '#F59E0B' },
  { name: 'Online', value: 5, color: '#8B5CF6' }
];

const mockAlerts: PerformanceAlert[] = [
  {
    id: '1',
    type: 'goal_deviation',
    severity: 'high',
    title: 'Meta de Vendas Abaixo do Esperado',
    description: 'Vendedor João Silva está 25% abaixo da meta mensal',
    createdAt: new Date(),
    resolved: false
  },
  {
    id: '2',
    type: 'inventory_low',
    severity: 'medium',
    title: 'Estoque Baixo',
    description: '15 produtos com estoque crítico',
    createdAt: new Date(),
    resolved: false
  },
  {
    id: '3',
    type: 'payment_overdue',
    severity: 'high',
    title: 'Pagamentos em Atraso',
    description: 'R$ 12.500 em pagamentos vencidos',
    createdAt: new Date(),
    resolved: false
  }
];

// ===== COMPONENTE PRINCIPAL =====
export const ExecutiveDashboard: React.FC = () => {
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date()
    },
    channel: 'all',
    region: 'all',
    seller: 'all',
    period: 'month'
  });
  
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotification();

  // Ícones para KPIs
  const getKPIIcon = (iconName: string) => {
    switch (iconName) {
      case 'dollar-sign': return <FiDollarSign />;
      case 'trending-up': return <FiTrendingUp />;
      case 'alert-triangle': return <FiAlertTriangle />;
      case 'package': return <FiPackage />;
      case 'users': return <FiUsers />;
      default: return <FiTrendingUp />;
    }
  };

  // Atualizar filtros
  const handleFilterChange = (key: keyof DashboardFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Exportar dados
  const handleExport = async () => {
    setLoading(true);
    try {
      // Simular exportação
      await new Promise(resolve => setTimeout(resolve, 2000));
      addNotification({
        type: 'success',
        title: 'Relatório exportado com sucesso!'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro ao exportar relatório'
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualizar dados
  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Simular atualização
      await new Promise(resolve => setTimeout(resolve, 1000));
      addNotification({
        type: 'success',
        title: 'Dados atualizados!'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro ao atualizar dados'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardContainer>
      <DashboardHeader>
        <h1>Dashboard Executivo</h1>
        <ActionButtons>
          <ActionButton 
            className="secondary" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <FiRefreshCw /> Atualizar
          </ActionButton>
          <ActionButton onClick={handleExport} disabled={loading}>
            <FiDownload /> Exportar
          </ActionButton>
        </ActionButtons>
      </DashboardHeader>

      {/* Filtros */}
      <FiltersContainer>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <FiFilter />
          <h3 style={{ margin: 0, color: '#374151' }}>Filtros Avançados</h3>
        </div>
        
        <FiltersGrid>
          <FilterGroup>
            <label>Período</label>
            <select 
              value={filters.period} 
              onChange={(e) => handleFilterChange('period', e.target.value)}
            >
              <option value="day">Diário</option>
              <option value="week">Semanal</option>
              <option value="month">Mensal</option>
              <option value="quarter">Trimestral</option>
              <option value="year">Anual</option>
            </select>
          </FilterGroup>
          
          <FilterGroup>
            <label>Canal de Vendas</label>
            <select 
              value={filters.channel} 
              onChange={(e) => handleFilterChange('channel', e.target.value)}
            >
              <option value="all">Todos os Canais</option>
              <option value="marketplace">Marketplace</option>
              <option value="physical_store">Loja Física</option>
              <option value="sellers">Vendedores</option>
              <option value="online">Online</option>
            </select>
          </FilterGroup>
          
          <FilterGroup>
            <label>Região</label>
            <select 
              value={filters.region} 
              onChange={(e) => handleFilterChange('region', e.target.value)}
            >
              <option value="all">Todas as Regiões</option>
              <option value="north">Norte</option>
              <option value="northeast">Nordeste</option>
              <option value="center_west">Centro-Oeste</option>
              <option value="southeast">Sudeste</option>
              <option value="south">Sul</option>
            </select>
          </FilterGroup>
          
          <FilterGroup>
            <label>Vendedor</label>
            <select 
              value={filters.seller} 
              onChange={(e) => handleFilterChange('seller', e.target.value)}
            >
              <option value="all">Todos os Vendedores</option>
              <option value="joao">João Silva</option>
              <option value="maria">Maria Santos</option>
              <option value="pedro">Pedro Costa</option>
            </select>
          </FilterGroup>
          
          <FilterGroup>
            <label>Data Inicial</label>
            <input 
              type="date" 
              value={filters.dateRange.startDate.toISOString().split('T')[0]}
              onChange={(e) => handleFilterChange('dateRange', {
                ...filters.dateRange,
                startDate: new Date(e.target.value)
              })}
            />
          </FilterGroup>
          
          <FilterGroup>
            <label>Data Final</label>
            <input 
              type="date" 
              value={filters.dateRange.endDate.toISOString().split('T')[0]}
              onChange={(e) => handleFilterChange('dateRange', {
                ...filters.dateRange,
                endDate: new Date(e.target.value)
              })}
            />
          </FilterGroup>
        </FiltersGrid>
      </FiltersContainer>

      {/* KPIs */}
      <KPIGrid>
        {mockKPIs.map(kpi => (
          <KPICardContainer key={kpi.id}>
            <KPIHeader>
              <h3>{kpi.title}</h3>
              <KPIIcon color={kpi.color}>
                {getKPIIcon(kpi.icon)}
              </KPIIcon>
            </KPIHeader>
            <KPIValue>{kpi.value}</KPIValue>
            <KPIChange positive={kpi.changeType === 'increase'}>
              {kpi.changeType === 'increase' ? <FiTrendingUp /> : <FiTrendingDown />}
              {Math.abs(kpi.change)}{typeof kpi.change === 'number' && kpi.change % 1 !== 0 ? '%' : ''} 
              {kpi.changeType === 'increase' ? 'aumento' : 'redução'}
            </KPIChange>
          </KPICardContainer>
        ))}
      </KPIGrid>

      {/* Gráficos */}
      <ChartsGrid>
        <ChartContainer>
          <h3>Vendas vs Meta</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockSalesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${value.toLocaleString()}`, '']} />
              <Legend />
              <Bar dataKey="vendas" fill="#10B981" name="Vendas" />
              <Bar dataKey="meta" fill="#E5E7EB" name="Meta" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <ChartContainer>
          <h3>Distribuição por Canal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockChannelData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {mockChannelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </ChartsGrid>

      {/* Alertas */}
      <AlertsContainer>
        <h3>
          <FiAlertTriangle />
          Alertas de Performance
        </h3>
        {mockAlerts.map(alert => (
          <AlertItem key={alert.id} severity={alert.severity}>
            <div className="alert-content">
              <div className="alert-title">{alert.title}</div>
              <div className="alert-description">{alert.description}</div>
            </div>
          </AlertItem>
        ))}
      </AlertsContainer>
    </DashboardContainer>
  );
};

export default ExecutiveDashboard;