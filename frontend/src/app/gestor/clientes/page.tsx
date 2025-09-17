'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiBarChart } from 'react-icons/fi';
import ClientTable, { Client } from '@/components/clients/ClientTable';
import ClientFormModal from '@/components/clients/ClientFormModal';
import PageTitle from '@/components/ui/PageTitle';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const ClientesGestorPage = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState({
    total_clients: 0,
    by_type: { cliente_final: 0, latoeiro: 0, mecanico: 0 },
    by_lead_status: { quente: 0, frio: 0, neutro: 0 },
    by_lead_origin: {},
    conversion_rate: 0
  });
  const [segmentStats, setSegmentStats] = useState({
    high_value: 0,
    frequent_buyers: 0,
    inactive: 0
  });

  // Carregar clientes
  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
      setFilteredClients(response.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      alert('Erro ao carregar clientes. Tente novamente.');
    }
  };

  // Carregar estatísticas
  const fetchStats = async () => {
    try {
      const [countResponse, segmentResponse] = await Promise.all([
        api.get('/clients/stats/count'),
        api.get('/clients/stats/segments')
      ]);
      
      // Transformar dados de contagem
      setStats(countResponse.data);
      
      // Transformar dados de segmentos de array para objeto
      if (segmentResponse.data && segmentResponse.data.segments) {
        const segmentsArray = segmentResponse.data.segments;
        const transformedSegmentStats = segmentsArray.reduce((acc: any, segment: any) => {
          const key = segment.type.toLowerCase().replace(/\s+/g, '_');
          acc[key] = segment.count;
          return acc;
        }, {});
        setSegmentStats(transformedSegmentStats);
      } else {
        // Fallback caso a estrutura seja diferente
        setSegmentStats(segmentResponse.data || {
          high_value: 0,
          frequent_buyers: 0,
          inactive: 0
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([fetchClients(), fetchStats()]);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Filtrar clientes
  useEffect(() => {
    let filtered = clients;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm) ||
        client.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (filterType) {
      filtered = filtered.filter(client => client.client_type === filterType);
    }

    // Filtro por status
    if (filterStatus) {
      filtered = filtered.filter(client => client.lead_status === filterStatus);
    }

    setFilteredClients(filtered);
  }, [clients, searchTerm, filterType, filterStatus]);

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleModalSuccess = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchClients(), fetchStats()]);
    } catch (error) {
      console.error('Erro ao recarregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportClients = () => {
    // Implementar exportação CSV
    const csvContent = [
      ['Nome', 'Tipo', 'Status Lead', 'Email', 'Telefone', 'Origem', 'Criado em'].join(','),
      ...filteredClients.map(client => [
        client.name,
        client.client_type,
        client.lead_status,
        client.email || '',
        client.phone || '',
        client.lead_origin,
        new Date(client.created_at).toLocaleDateString('pt-BR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_relatorio_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterStatus('');
  };

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageTitle title="Relatório de Clientes" colorScheme="gestor" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-slate-400">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Relatório de Clientes" colorScheme="gestor" />

      {/* Estatísticas Gerenciais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-blue-600 dark:text-blue-400 text-xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total de Clientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_clients ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="text-green-600 dark:text-green-400 text-xl">💎</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Alto Valor</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{segmentStats?.high_value ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <span className="text-purple-600 dark:text-purple-400 text-xl">🔄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Compradores Frequentes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{segmentStats?.frequent_buyers ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <span className="text-red-600 dark:text-red-400 text-xl">😴</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Inativos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{segmentStats?.inactive ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Distribuição por Tipo e Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FiBarChart className="mr-2" />
            Distribuição por Tipo
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-slate-400">Cliente Final</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(stats?.total_clients ?? 0) > 0 ? ((stats?.by_type?.cliente_final ?? 0) / (stats?.total_clients ?? 1)) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats?.by_type?.cliente_final ?? 0}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-slate-400">Latoeiro</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(stats?.total_clients ?? 0) > 0 ? ((stats?.by_type?.latoeiro ?? 0) / (stats?.total_clients ?? 1)) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats?.by_type?.latoeiro ?? 0}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-slate-400">Mecânico</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${(stats?.total_clients ?? 0) > 0 ? ((stats?.by_type?.mecanico ?? 0) / (stats?.total_clients ?? 1)) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats?.by_type?.mecanico ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FiBarChart className="mr-2" />
            Status dos Leads
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-slate-400">Quente</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${(stats?.total_clients ?? 0) > 0 ? ((stats?.by_lead_status?.quente ?? 0) / (stats?.total_clients ?? 1)) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats?.by_lead_status?.quente ?? 0}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-slate-400">Neutro</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full" 
                    style={{ width: `${(stats?.total_clients ?? 0) > 0 ? ((stats?.by_lead_status?.neutro ?? 0) / (stats?.total_clients ?? 1)) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats?.by_lead_status?.neutro ?? 0}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-slate-400">Frio</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(stats?.total_clients ?? 0) > 0 ? ((stats?.by_lead_status?.frio ?? 0) / (stats?.total_clients ?? 1)) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats?.by_lead_status?.frio ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Busca */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Todos os tipos</option>
              <option value="Cliente Final">Cliente Final</option>
              <option value="Latoeiro">Latoeiro</option>
              <option value="Mecânico">Mecânico</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Todos os status</option>
              <option value="Quente">Quente</option>
              <option value="Neutro">Neutro</option>
              <option value="Frio">Frio</option>
            </select>

            {(searchTerm || filterType || filterStatus) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportClients}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              <FiDownload className="h-4 w-4" />
              <span>Exportar Relatório</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Clientes - Somente Leitura e Edição */}
      <ClientTable
        clients={filteredClients}
        canEdit={true}
        canDelete={false}
        onEdit={handleEditClient}
        onDelete={() => {}}
        isLoading={isLoading}
      />

      {/* Modal de Edição */}
      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode="edit"
        client={selectedClient}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default ClientesGestorPage;