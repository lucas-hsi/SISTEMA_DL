'use client';

import { useState, useEffect } from 'react';
import { FiPackage, FiEdit3, FiTrendingUp, FiEye } from 'react-icons/fi';
import PageTitle from '@/components/ui/PageTitle';

interface DashboardStats {
  totalProducts: number;
  activeAds: number;
  totalViews: number;
  conversionRate: number;
}

const AnunciosDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeAds: 0,
    totalViews: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados
    const loadStats = async () => {
      try {
        // Aqui você pode fazer chamadas reais para a API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalProducts: 150,
          activeAds: 45,
          totalViews: 12500,
          conversionRate: 3.2
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageTitle 
        title="Dashboard de Anúncios"
        subtitle="Gerencie seus produtos e anúncios"
        colorScheme="anuncios"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiPackage className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiEdit3 className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Anúncios Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeAds}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiEye className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Visualizações</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/anuncios/catalogo"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiPackage className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Gerenciar Catálogo</h3>
              <p className="text-sm text-gray-600">Adicionar, editar e remover produtos</p>
            </div>
          </a>

          <a
            href="/anuncios/gerar-anuncio"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiEdit3 className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Gerar Anúncio</h3>
              <p className="text-sm text-gray-600">Criar novos anúncios para seus produtos</p>
            </div>
          </a>
        </div>
      </div>

      {/* Recent Products */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Produtos Recentes</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-lg mr-3 flex items-center justify-center">
                <FiPackage className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Filtro de Óleo Motor</h3>
                <p className="text-xs text-gray-500">SKU: FLT001 • Categoria: Filtros</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">R$ 45,90</p>
              <p className="text-xs text-gray-500">25 em estoque</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-lg mr-3 flex items-center justify-center">
                <FiPackage className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Pastilha de Freio Dianteira</h3>
                <p className="text-xs text-gray-500">SKU: PST002 • Categoria: Freios</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">R$ 89,90</p>
              <p className="text-xs text-gray-500">15 em estoque</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-lg mr-3 flex items-center justify-center">
                <FiPackage className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Óleo Motor 5W30</h3>
                <p className="text-xs text-gray-500">SKU: OIL003 • Categoria: Óleos</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">R$ 65,90</p>
              <p className="text-xs text-gray-500">8 em estoque</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <a
            href="/anuncios/catalogo"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Ver todos os produtos →
          </a>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Performance dos Anúncios</h2>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <FiTrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Gráfico de performance será implementado aqui</p>
            <p className="text-sm text-gray-400 mt-1">Visualizações, cliques e conversões ao longo do tempo</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnunciosDashboard;