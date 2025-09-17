'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiFilter, FiDownload } from 'react-icons/fi';
import ClientTable, { Client } from '@/components/clients/ClientTable';
import ClientFormModal from '@/components/clients/ClientFormModal';
import PageTitle from '@/components/ui/PageTitle';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const ClientesVendedorPage = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedClient, setSelectedClient] = useState<Client | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState({
    total_clients: 0,
    by_type: { cliente_final: 0, latoeiro: 0, mecanico: 0 },
    by_lead_status: { quente: 0, frio: 0, neutro: 0 }
  });

  // Carregar clientes
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/clients');
      setClients(response.data);
      setFilteredClients(response.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      alert('Erro ao carregar clientes. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar estatísticas
  const fetchStats = async () => {
    try {
      const response = await api.get('/clients/stats/count');
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchStats();
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

  const handleCreateClient = () => {
    setModalMode('create');
    setSelectedClient(undefined);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setModalMode('edit');
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (clientId: number) => {
    if (!confirm('Tem certeza que deseja deletar este cliente?')) {
      return;
    }

    try {
      await api.delete(`/api/v1/clients/${clientId}`);
      await fetchClients();
      await fetchStats();
      alert('Cliente deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      alert('Erro ao deletar cliente. Tente novamente.');
    }
  };

  const handleModalSuccess = async () => {
    await fetchClients();
    await fetchStats();
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
    link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
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

  return (
    <div className="space-y-6">
      <PageTitle title="Gerenciamento de Clientes" colorScheme="vendedor" />

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-blue-600 dark:text-blue-400 text-xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total de Clientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_clients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <span className="text-red-600 dark:text-red-400 text-xl">🔥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Leads Quentes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.by_lead_status.quente}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="text-green-600 dark:text-green-400 text-xl">🛒</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Clientes Finais</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.by_type.cliente_final}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <span className="text-purple-600 dark:text-purple-400 text-xl">🔧</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Profissionais</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.by_type.latoeiro + stats.by_type.mecanico}</p>
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
              <span>Exportar</span>
            </button>
            
            <button
              onClick={handleCreateClient}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="h-4 w-4" />
              <span>Adicionar Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Clientes */}
      <ClientTable
        clients={filteredClients}
        canEdit={true}
        canDelete={true}
        onEdit={handleEditClient}
        onDelete={handleDeleteClient}
        isLoading={isLoading}
      />

      {/* Modal de Formulário */}
      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        client={selectedClient}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default ClientesVendedorPage;