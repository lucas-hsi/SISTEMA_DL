'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiDownload, FiUpload } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdsList from '@/components/ads/AdsList';
import AdForm from '@/components/ads/AdForm';
import { useAuth } from '@/hooks/useAuth';
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

const GerenciarAnunciosPage = () => {
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const { refreshAds } = useAds();
  
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    ready: 0,
    published: 0,
    paused: 0,
    error: 0
  });

  // Verificar permissões
  useEffect(() => {
    if (user && !hasRole('anuncios') && !hasRole('gestor')) {
      router.push('/dashboard');
    }
  }, [user, hasRole, router]);

  // Não renderizar se não tiver permissão
  if (user && !hasRole('anuncios') && !hasRole('gestor')) {
    return null;
  }

  const handleEdit = (ad: Ad) => {
    setSelectedAd(ad);
    setIsEditModalOpen(true);
  };

  const handleDelete = (ad: Ad) => {
    // Atualizar estatísticas após exclusão
    refreshAds();
  };

  const handleStatusChange = (ad: Ad, newStatus: string) => {
    // Atualizar estatísticas após mudança de status
    refreshAds();
  };

  const handleCloseEditModal = () => {
    setSelectedAd(null);
    setIsEditModalOpen(false);
    refreshAds();
  };

  const handleExportAds = () => {
    // Implementar exportação de anúncios
    console.log('Exportar anúncios');
  };

  const handleImportAds = () => {
    // Implementar importação de anúncios
    console.log('Importar anúncios');
  };

  const breadcrumbItems = [
    { label: 'Anúncios', href: '/anuncios/dashboard' },
    { label: 'Gerenciar', href: '/anuncios/gerenciar' }
  ];

  return (
    <DashboardLayout 
      requiredRole="anuncios"
      roleDisplayName="Anúncios"
    >
      <div className="space-y-6">
        {/* Header com ações */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gerenciar Anúncios</h1>
              <p className="text-gray-600 mt-1">
                Visualize, edite e gerencie todos os seus anúncios em um só lugar.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleImportAds}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FiUpload size={16} />
                Importar
              </button>
              
              <button
                onClick={handleExportAds}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FiDownload size={16} />
                Exportar
              </button>
              
              <button
                onClick={() => router.push('/anuncios/gerar-anuncio')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FiPlus size={16} />
                Novo Anúncio
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm">📊</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rascunhos</p>
                <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm">📝</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-500">Prontos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.ready}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">✅</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-500">Publicados</p>
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">🚀</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-500">Pausados</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.paused}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm">⏸️</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-500">Erros</p>
                <p className="text-2xl font-bold text-red-600">{stats.error}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm">❌</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de anúncios */}
        <AdsList
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          showFilters={true}
          pageSize={20}
        />

        {/* Modal de edição */}
        {isEditModalOpen && selectedAd && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Editar Anúncio
                  </h3>
                  <button
                    onClick={handleCloseEditModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Fechar</span>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <AdForm
                  initialData={{
                    title: selectedAd.title,
                    subtitle: selectedAd.subtitle || '',
                    bullet_points: selectedAd.bullet_points,
                    description: selectedAd.description,
                    category_path: selectedAd.category_path,
                    price_strategy: selectedAd.price_strategy,
                    price_value: selectedAd.price_value,
                    marketplace: selectedAd.marketplace
                  }}
                  onSubmit={async (data) => {
                    // Implementar atualização do anúncio
                    console.log('Atualizar anúncio:', data);
                    handleCloseEditModal();
                  }}
                  onCancel={handleCloseEditModal}
                  mode="edit"
                />
              </div>
            </div>
          </div>
        )}

        {/* Ações em lote (se houver anúncios selecionados) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Publicação em Lote</h4>
              <p className="text-sm text-gray-600 mb-3">
                Publique múltiplos anúncios prontos de uma vez.
              </p>
              <button className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                Publicar Selecionados
              </button>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Pausar Anúncios</h4>
              <p className="text-sm text-gray-600 mb-3">
                Pause anúncios publicados temporariamente.
              </p>
              <button className="w-full px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">
                Pausar Selecionados
              </button>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Atualizar Preços</h4>
              <p className="text-sm text-gray-600 mb-3">
                Recalcule preços baseado nas estratégias.
              </p>
              <button className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                Atualizar Preços
              </button>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Sincronizar</h4>
              <p className="text-sm text-gray-600 mb-3">
                Sincronize status com os marketplaces.
              </p>
              <button className="w-full px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                Sincronizar Todos
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GerenciarAnunciosPage;