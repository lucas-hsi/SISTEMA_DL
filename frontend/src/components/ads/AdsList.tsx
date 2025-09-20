'use client';

import { useState, useEffect } from 'react';
import { FiEdit3, FiTrash2, FiCheck, FiSearch, FiFilter, FiRefreshCw } from 'react-icons/fi';
import useAds from '@/hooks/useAds';

interface Ad {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  bullet_points: string[];
  category_path: string;
  price_strategy: string;
  price_value?: number;
  marketplace: string;
  status: string;
  product_id: number;
  company_id: number;
  external_id?: string;
  created_at: string;
  updated_at: string;
}

interface AdsListProps {
  onEdit?: (ad: Ad) => void;
  onDelete?: (ad: Ad) => void;
  onStatusChange?: (ad: Ad, newStatus: string) => void;
  className?: string;
  showFilters?: boolean;
  pageSize?: number;
}

const AdsList = ({ 
  onEdit, 
  onDelete, 
  onStatusChange, 
  className = '',
  showFilters = true,
  pageSize = 10
}: AdsListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [marketplaceFilter, setMarketplaceFilter] = useState('');
  const [selectedAds, setSelectedAds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  const {
    ads,
    loading,
    error,
    totalPages,
    fetchAds,
    updateStatus,
    updateStatusBatch,
    deleteExistingAd,
    searchAdsByText,
    refreshAds
  } = useAds();

  // Status disponíveis
  const statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'draft', label: 'Rascunho' },
    { value: 'ready', label: 'Pronto' },
    { value: 'published', label: 'Publicado' },
    { value: 'paused', label: 'Pausado' },
    { value: 'error', label: 'Erro' }
  ];

  // Marketplaces disponíveis
  const marketplaceOptions = [
    { value: '', label: 'Todos os marketplaces' },
    { value: 'mercadolivre', label: 'Mercado Livre' },
    { value: 'shopee', label: 'Shopee' },
    { value: 'amazon', label: 'Amazon' },
    { value: 'magalu', label: 'Magazine Luiza' }
  ];

  // Carregar anúncios quando filtros mudarem
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: pageSize,
      ...(statusFilter && { status: statusFilter }),
      ...(marketplaceFilter && { marketplace: marketplaceFilter })
    };
    
    if (searchQuery.trim()) {
      searchAdsByText(searchQuery);
    } else {
      fetchAds(params);
    }
  }, [currentPage, statusFilter, marketplaceFilter, searchQuery, pageSize]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleMarketplaceFilter = (marketplace: string) => {
    setMarketplaceFilter(marketplace);
    setCurrentPage(1);
  };

  const handleSelectAd = (adId: number) => {
    setSelectedAds(prev => 
      prev.includes(adId) 
        ? prev.filter(id => id !== adId)
        : [...prev, adId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAds.length === ads.length) {
      setSelectedAds([]);
    } else {
      setSelectedAds(ads.map(ad => ad.id));
    }
  };

  const handleBatchStatusUpdate = async (newStatus: string) => {
    if (selectedAds.length === 0) return;
    
    const success = await updateStatusBatch(selectedAds, newStatus);
    if (success) {
      setSelectedAds([]);
      // Notificar sobre mudanças se callback fornecido
      selectedAds.forEach(adId => {
        const ad = ads.find(a => a.id === adId);
        if (ad && onStatusChange) {
          onStatusChange({ ...ad, status: newStatus }, newStatus);
        }
      });
    }
  };

  const handleStatusChange = async (ad: Ad, newStatus: string) => {
    const success = await updateStatus(ad.id, newStatus);
    if (success && onStatusChange) {
      onStatusChange({ ...ad, status: newStatus }, newStatus);
    }
  };

  const handleDelete = async (ad: Ad) => {
    if (window.confirm(`Tem certeza que deseja excluir o anúncio "${ad.title}"?`)) {
      const success = await deleteExistingAd(ad.id);
      if (success && onDelete) {
        onDelete(ad);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Rascunho' },
      ready: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pronto' },
      published: { bg: 'bg-green-100', text: 'text-green-800', label: 'Publicado' },
      paused: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pausado' },
      error: { bg: 'bg-red-100', text: 'text-red-800', label: 'Erro' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getMarketplaceBadge = (marketplace: string) => {
    const marketplaceConfig = {
      mercadolivre: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'ML' },
      shopee: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Shopee' },
      amazon: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Amazon' },
      magalu: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Magalu' }
    };
    
    const config = marketplaceConfig[marketplace as keyof typeof marketplaceConfig] || 
                   { bg: 'bg-gray-100', text: 'text-gray-800', label: marketplace };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-800 font-medium">Erro ao carregar anúncios</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={refreshAds}
            className="text-red-600 hover:text-red-800"
          >
            <FiRefreshCw size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Filtros */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar anúncios..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Filtros */}
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <select
                value={marketplaceFilter}
                onChange={(e) => handleMarketplaceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {marketplaceOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={refreshAds}
                disabled={loading}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                title="Atualizar lista"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          
          {/* Ações em lote */}
          {selectedAds.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedAds.length} anúncio(s) selecionado(s)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBatchStatusUpdate('ready')}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Marcar como Pronto
                  </button>
                  <button
                    onClick={() => handleBatchStatusUpdate('published')}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Publicar
                  </button>
                  <button
                    onClick={() => handleBatchStatusUpdate('paused')}
                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                  >
                    Pausar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Loading */}
      {loading && (
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Carregando anúncios...</p>
        </div>
      )}
      
      {/* Lista de anúncios */}
      {!loading && ads.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>Nenhum anúncio encontrado.</p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedAds.length === ads.length && ads.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anúncio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marketplace
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Atualizado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ads.map((ad) => (
                <tr key={ad.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedAds.includes(ad.id)}
                      onChange={() => handleSelectAd(ad.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="max-w-xs">
                      <h4 className="font-medium text-gray-900 truncate">{ad.title}</h4>
                      {ad.subtitle && (
                        <p className="text-sm text-gray-500 truncate">{ad.subtitle}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {ad.bullet_points.length} características
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {getMarketplaceBadge(ad.marketplace)}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={ad.status}
                      onChange={(e) => handleStatusChange(ad, e.target.value)}
                      className="text-sm border-0 bg-transparent focus:ring-0 p-0"
                    >
                      <option value="draft">Rascunho</option>
                      <option value="ready">Pronto</option>
                      <option value="published">Publicado</option>
                      <option value="paused">Pausado</option>
                      <option value="error">Erro</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {ad.price_value ? (
                      `R$ ${ad.price_value.toFixed(2).replace('.', ',')}`
                    ) : (
                      <span className="text-gray-500">{ad.price_strategy}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {new Date(ad.updated_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {ad.status === 'draft' && (
                        <button
                          onClick={() => handleStatusChange(ad, 'ready')}
                          className="text-blue-600 hover:text-blue-800"
                          title="Marcar como pronto"
                        >
                          <FiCheck size={16} />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(ad)}
                          className="text-gray-600 hover:text-gray-800"
                          title="Editar anúncio"
                        >
                          <FiEdit3 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(ad)}
                        className="text-red-600 hover:text-red-800"
                        title="Excluir anúncio"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Paginação */}
      {!loading && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsList;
export type { AdsListProps, Ad };