// Componente StrategicReports - DL Auto Peças

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  FiBarChart3,
  FiTrendingUp,
  FiTrendingDown,
  FiDownload,
  FiFilter,
  FiCalendar,
  FiUsers,
  FiShoppingCart,
  FiDollarSign,
  FiTarget,
  FiPieChart,
  FiActivity,
  FiRefreshCw,
  FiEye,
  FiFileText,
  FiShare2
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Button, Select, Input } from '../common';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { ReportFilters, ReportType, SalesData, PerformanceData } from '../../types/manager';

// ===== TIPOS =====
interface ReportData {
  id: string;
  title: string;
  type: ReportType;
  description: string;
  data: any[];
  generatedAt: Date;
  filters: ReportFilters;
}

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area';
  dataKey: string;
  xAxisKey?: string;
  colors: string[];
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
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
`;

const FiltersContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.colors.border};
`;

const ReportsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`;

const ReportCard = styled.div`
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const ReportHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const ReportTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const ReportActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ChartContainer = styled.div`
  padding: 1.5rem;
  height: 300px;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const MetricItem = styled.div`
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.25rem;
`;

const MetricLabel = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const SummaryCard = styled.div<{ variant?: 'success' | 'warning' | 'error' | 'info' }>`
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => {
    switch (props.variant) {
      case 'success': return props.theme.colors.success;
      case 'warning': return props.theme.colors.warning;
      case 'error': return props.theme.colors.error;
      default: return props.theme.colors.border;
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
      case 'success': return props.theme.colors.success + '20';
      case 'warning': return props.theme.colors.warning + '20';
      case 'error': return props.theme.colors.error + '20';
      default: return props.theme.colors.primary + '20';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'success': return props.theme.colors.success;
      case 'warning': return props.theme.colors.warning;
      case 'error': return props.theme.colors.error;
      default: return props.theme.colors.primary;
    }
  }};
`;

const SummaryTitle = styled.h3`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SummaryValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.5rem;
`;

const SummaryChange = styled.div<{ positive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: ${props => props.positive ? props.theme.colors.success : props.theme.colors.error};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: ${props => props.theme.colors.text.secondary};
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: ${props => props.theme.colors.text.secondary};
`;

// ===== DADOS MOCK =====
const mockSalesData = [
  { month: 'Jan', vendas: 45000, meta: 50000, margem: 15 },
  { month: 'Fev', vendas: 52000, meta: 50000, margem: 18 },
  { month: 'Mar', vendas: 48000, meta: 50000, margem: 16 },
  { month: 'Abr', vendas: 61000, meta: 55000, margem: 20 },
  { month: 'Mai', vendas: 55000, meta: 55000, margem: 17 },
  { month: 'Jun', vendas: 67000, meta: 60000, margem: 22 }
];

const mockChannelData = [
  { name: 'Marketplace', value: 35, vendas: 180000 },
  { name: 'Loja Física', value: 25, vendas: 130000 },
  { name: 'Vendedores', value: 30, vendas: 155000 },
  { name: 'Online', value: 10, vendas: 52000 }
];

const mockPerformanceData = [
  { vendedor: 'João Silva', vendas: 85000, meta: 80000, conversao: 15.5 },
  { vendedor: 'Maria Santos', vendas: 92000, meta: 85000, conversao: 18.2 },
  { vendedor: 'Pedro Costa', vendas: 78000, meta: 80000, conversao: 14.8 },
  { vendedor: 'Ana Oliveira', vendas: 95000, meta: 90000, conversao: 19.1 },
  { vendedor: 'Carlos Lima', vendas: 72000, meta: 75000, conversao: 13.9 }
];

const mockRegionData = [
  { regiao: 'Norte', vendas: 125000, crescimento: 12.5 },
  { regiao: 'Nordeste', vendas: 180000, crescimento: 8.3 },
  { regiao: 'Centro-Oeste', vendas: 95000, crescimento: 15.7 },
  { regiao: 'Sudeste', vendas: 320000, crescimento: 6.2 },
  { regiao: 'Sul', vendas: 210000, crescimento: 10.1 }
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

// ===== COMPONENTE =====
export const StrategicReports: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const showSuccess = (message: string) => showNotification(message, 'success');
  const showError = (message: string) => showNotification(message, 'error');
  
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: '',
    dateTo: '',
    channel: '',
    seller: '',
    region: '',
    reportType: 'sales'
  });
  
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<ReportData[]>([]);
  
  // Opções para filtros
  const reportTypeOptions = [
    { value: 'sales', label: 'Vendas' },
    { value: 'performance', label: 'Performance' },
    { value: 'financial', label: 'Financeiro' },
    { value: 'inventory', label: 'Estoque' }
  ];
  
  const channelOptions = [
    { value: '', label: 'Todos os canais' },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'loja_fisica', label: 'Loja Física' },
    { value: 'vendedores', label: 'Vendedores' },
    { value: 'online', label: 'Online' }
  ];
  
  const sellerOptions = [
    { value: '', label: 'Todos os vendedores' },
    { value: 'joao_silva', label: 'João Silva' },
    { value: 'maria_santos', label: 'Maria Santos' },
    { value: 'pedro_costa', label: 'Pedro Costa' },
    { value: 'ana_oliveira', label: 'Ana Oliveira' },
    { value: 'carlos_lima', label: 'Carlos Lima' }
  ];
  
  const regionOptions = [
    { value: '', label: 'Todas as regiões' },
    { value: 'norte', label: 'Norte' },
    { value: 'nordeste', label: 'Nordeste' },
    { value: 'centro_oeste', label: 'Centro-Oeste' },
    { value: 'sudeste', label: 'Sudeste' },
    { value: 'sul', label: 'Sul' }
  ];
  
  // Calcular métricas resumo
  const summaryMetrics = React.useMemo(() => {
    const totalSales = mockSalesData.reduce((sum, item) => sum + item.vendas, 0);
    const totalGoal = mockSalesData.reduce((sum, item) => sum + item.meta, 0);
    const avgMargin = mockSalesData.reduce((sum, item) => sum + item.margem, 0) / mockSalesData.length;
    const goalAchievement = (totalSales / totalGoal) * 100;
    
    return {
      totalSales,
      goalAchievement,
      avgMargin,
      topPerformer: mockPerformanceData.reduce((prev, current) => 
        (prev.vendas > current.vendas) ? prev : current
      )
    };
  }, []);
  
  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const generateReport = async () => {
    try {
      setLoading(true);
      
      // Simular geração de relatório
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newReport: ReportData = {
        id: Date.now().toString(),
        title: `Relatório ${filters.reportType === 'sales' ? 'de Vendas' : 'de Performance'}`,
        type: filters.reportType as ReportType,
        description: 'Relatório gerado automaticamente com base nos filtros selecionados',
        data: filters.reportType === 'sales' ? mockSalesData : mockPerformanceData,
        generatedAt: new Date(),
        filters: { ...filters }
      };
      
      setReports(prev => [newReport, ...prev]);
      showSuccess('Relatório gerado com sucesso!');
    } catch (error) {
      showError('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };
  
  const exportReport = (reportId: string, format: 'pdf' | 'excel') => {
    // Simular exportação
    showSuccess(`Relatório exportado em ${format.toUpperCase()}!`);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: '4px 0', color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' && entry.name.includes('vendas') 
                ? formatCurrency(entry.value) 
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <Container>
      <Header>
        <Title>
          <FiBarChart3 />
          Relatórios Estratégicos
        </Title>
        <Button
          onClick={generateReport}
          loading={loading}
          icon={<FiRefreshCw />}
        >
          Gerar Relatório
        </Button>
      </Header>
      
      <FiltersContainer>
        <Select
          label="Tipo de Relatório"
          options={reportTypeOptions}
          value={filters.reportType}
          onChange={(e) => handleFilterChange('reportType', e.target.value)}
        />
        
        <Select
          label="Canal"
          options={channelOptions}
          value={filters.channel}
          onChange={(e) => handleFilterChange('channel', e.target.value)}
        />
        
        <Select
          label="Vendedor"
          options={sellerOptions}
          value={filters.seller}
          onChange={(e) => handleFilterChange('seller', e.target.value)}
        />
        
        <Select
          label="Região"
          options={regionOptions}
          value={filters.region}
          onChange={(e) => handleFilterChange('region', e.target.value)}
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
      
      <SummaryCards>
        <SummaryCard variant="success">
          <SummaryHeader>
            <SummaryTitle>Vendas Totais</SummaryTitle>
            <SummaryIcon variant="success">
              <FiDollarSign />
            </SummaryIcon>
          </SummaryHeader>
          <SummaryValue>{formatCurrency(summaryMetrics.totalSales)}</SummaryValue>
          <SummaryChange positive>
            <FiTrendingUp size={14} />
            Meta: {formatPercentage(summaryMetrics.goalAchievement)}
          </SummaryChange>
        </SummaryCard>
        
        <SummaryCard variant="info">
          <SummaryHeader>
            <SummaryTitle>Margem Média</SummaryTitle>
            <SummaryIcon variant="info">
              <FiTarget />
            </SummaryIcon>
          </SummaryHeader>
          <SummaryValue>{formatPercentage(summaryMetrics.avgMargin)}</SummaryValue>
          <SummaryChange positive={summaryMetrics.avgMargin > 15}>
            <FiActivity size={14} />
            {summaryMetrics.avgMargin > 15 ? 'Acima da meta' : 'Abaixo da meta'}
          </SummaryChange>
        </SummaryCard>
        
        <SummaryCard variant="warning">
          <SummaryHeader>
            <SummaryTitle>Top Performer</SummaryTitle>
            <SummaryIcon variant="warning">
              <FiUsers />
            </SummaryIcon>
          </SummaryHeader>
          <SummaryValue>{summaryMetrics.topPerformer.vendedor}</SummaryValue>
          <SummaryChange positive>
            <FiTrendingUp size={14} />
            {formatCurrency(summaryMetrics.topPerformer.vendas)}
          </SummaryChange>
        </SummaryCard>
        
        <SummaryCard>
          <SummaryHeader>
            <SummaryTitle>Relatórios Gerados</SummaryTitle>
            <SummaryIcon>
              <FiFileText />
            </SummaryIcon>
          </SummaryHeader>
          <SummaryValue>{reports.length}</SummaryValue>
          <SummaryChange>
            <FiActivity size={14} />
            Este mês
          </SummaryChange>
        </SummaryCard>
      </SummaryCards>
      
      <ReportsGrid>
        {/* Gráfico de Vendas vs Meta */}
        <ReportCard>
          <ReportHeader>
            <ReportTitle>
              <FiBarChart3 />
              Vendas vs Meta
            </ReportTitle>
            <ReportActions>
              <Button
                size="small"
                variant="secondary"
                icon={<FiDownload />}
                onClick={() => exportReport('sales', 'excel')}
              />
            </ReportActions>
          </ReportHeader>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockSalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="vendas" fill="#8884d8" name="Vendas" />
                <Bar dataKey="meta" fill="#82ca9d" name="Meta" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          <MetricsGrid>
            <MetricItem>
              <MetricValue>{formatCurrency(summaryMetrics.totalSales)}</MetricValue>
              <MetricLabel>Total Vendas</MetricLabel>
            </MetricItem>
            <MetricItem>
              <MetricValue>{formatPercentage(summaryMetrics.goalAchievement)}</MetricValue>
              <MetricLabel>Meta Atingida</MetricLabel>
            </MetricItem>
          </MetricsGrid>
        </ReportCard>
        
        {/* Gráfico de Canais */}
        <ReportCard>
          <ReportHeader>
            <ReportTitle>
              <FiPieChart />
              Distribuição por Canal
            </ReportTitle>
            <ReportActions>
              <Button
                size="small"
                variant="secondary"
                icon={<FiDownload />}
                onClick={() => exportReport('channels', 'pdf')}
              />
            </ReportActions>
          </ReportHeader>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockChannelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockChannelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ReportCard>
        
        {/* Gráfico de Performance */}
        <ReportCard>
          <ReportHeader>
            <ReportTitle>
              <FiActivity />
              Performance dos Vendedores
            </ReportTitle>
            <ReportActions>
              <Button
                size="small"
                variant="secondary"
                icon={<FiDownload />}
                onClick={() => exportReport('performance', 'excel')}
              />
            </ReportActions>
          </ReportHeader>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vendedor" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="vendas" fill="#8884d8" name="Vendas" />
                <Bar dataKey="meta" fill="#82ca9d" name="Meta" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ReportCard>
        
        {/* Gráfico de Regiões */}
        <ReportCard>
          <ReportHeader>
            <ReportTitle>
              <FiTrendingUp />
              Crescimento por Região
            </ReportTitle>
            <ReportActions>
              <Button
                size="small"
                variant="secondary"
                icon={<FiDownload />}
                onClick={() => exportReport('regions', 'pdf')}
              />
            </ReportActions>
          </ReportHeader>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockRegionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="regiao" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="crescimento" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                  name="Crescimento (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ReportCard>
      </ReportsGrid>
      
      {loading && (
        <LoadingState>
          <FiRefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ marginLeft: '0.5rem' }}>Gerando relatório...</span>
        </LoadingState>
      )}
      
      {reports.length === 0 && !loading && (
        <EmptyState>
          <FiFileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>Nenhum relatório gerado</h3>
          <p>Clique em "Gerar Relatório" para criar seu primeiro relatório estratégico.</p>
        </EmptyState>
      )}
    </Container>
  );
};

export default StrategicReports;