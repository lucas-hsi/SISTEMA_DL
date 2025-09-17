'use client';

import { useEffect, useState } from 'react';
import { 
  FiUsers, 
  FiDollarSign, 
  FiTrendingUp, 
  FiTarget,
  FiBarChart,
  FiActivity
} from 'react-icons/fi';
import PageTitle from '@/components/ui/PageTitle';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalSales: 0,
    monthlyGoal: 0,
    activeAds: 0
  });

  useEffect(() => {
    // Simular carregamento de dados
    // Em uma implementação real, aqui faria chamadas para a API
    setStats({
      totalEmployees: 12,
      totalSales: 45600,
      monthlyGoal: 80,
      activeAds: 24
    });
  }, []);

  const statCards = [
    {
      title: 'Total de Funcionários',
      value: stats.totalEmployees,
      icon: FiUsers,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Vendas do Mês',
      value: `R$ ${stats.totalSales.toLocaleString()}`,
      icon: FiDollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Meta Atingida',
      value: `${stats.monthlyGoal}%`,
      icon: FiTarget,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Anúncios Ativos',
      value: stats.activeAds,
      icon: FiActivity,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageTitle 
        title="Dashboard do Gestor"
        subtitle="Visão geral do desempenho da sua equipe e vendas"
        colorScheme="gestor"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Desempenho de Vendas
            </h3>
            <FiBarChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <FiTrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Gráfico de vendas será implementado aqui</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Atividades Recentes
          </h3>
          <div className="space-y-4">
            {[
              {
                action: 'Nova venda registrada',
                user: 'João Silva',
                time: '2 horas atrás',
                type: 'sale'
              },
              {
                action: 'Meta mensal atingida',
                user: 'Maria Santos',
                time: '4 horas atrás',
                type: 'goal'
              },
              {
                action: 'Novo anúncio publicado',
                user: 'Pedro Costa',
                time: '6 horas atrás',
                type: 'ad'
              }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'sale' ? 'bg-green-500' :
                  activity.type === 'goal' ? 'bg-blue-500' : 'bg-purple-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200">
            <FiUsers className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Gerenciar Equipe</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors duration-200">
            <FiDollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Relatório de Vendas</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors duration-200">
            <FiBarChart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Análise de Desempenho</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;