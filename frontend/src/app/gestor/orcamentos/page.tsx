'use client';

import { useState, useEffect } from 'react';
import { FiEye, FiGrid, FiList, FiMoreVertical, FiDownload, FiMessageCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { downloadOrderPDF, sendWhatsAppMessage, getOrderActionData } from '@/services/orderActions';
import api from '@/lib/api';

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  status: string;
  total_amount: number;
  created_at: string;
  seller_id: number;
}

const statusMap = {
  'ORCAMENTO_NOVO': 'Orçamento Novo',
  'ORCAMENTO_ENVIADO': 'Orçamento Enviado',
  'VENDIDO': 'Vendido',
  'CANCELADO': 'Cancelado'
};

const statusColors = {
  'ORCAMENTO_NOVO': 'bg-blue-100 text-blue-800',
  'ORCAMENTO_ENVIADO': 'bg-yellow-100 text-yellow-800',
  'VENDIDO': 'bg-green-100 text-green-800',
  'CANCELADO': 'bg-red-100 text-red-800'
};

export default function GestorOrcamentosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [sortField, setSortField] = useState<keyof Order>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showActionsMenu, setShowActionsMenu] = useState<number | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
      toast.error('Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getOrdersByStatus = (status: string) => {
    return sortedOrders.filter(order => order.status === status);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleDownloadPDF = async (orderId: number) => {
    setIsLoadingAction(true);
    try {
      await downloadOrderPDF(orderId);
      setShowActionsMenu(null);
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast.error('Erro ao baixar PDF do orçamento');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleSendWhatsApp = async (orderId: number) => {
    setIsLoadingAction(true);
    try {
      const orderData = await getOrderActionData(orderId);
      await sendWhatsAppMessage(orderData);
      setShowActionsMenu(null);
      toast.success('WhatsApp aberto com sucesso!');
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      toast.error('Erro ao abrir WhatsApp. Verifique se o cliente possui telefone cadastrado.');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const renderKanbanView = () => {
    const columns = [
      { status: 'ORCAMENTO_NOVO', title: 'Orçamento Novo', color: 'border-blue-200' },
      { status: 'ORCAMENTO_ENVIADO', title: 'Orçamento Enviado', color: 'border-yellow-200' },
      { status: 'VENDIDO', title: 'Vendido', color: 'border-green-200' },
      { status: 'CANCELADO', title: 'Cancelado', color: 'border-red-200' }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map(column => {
          const columnOrders = getOrdersByStatus(column.status);
          return (
            <div key={column.status} className={`bg-gray-50 rounded-lg p-4 border-t-4 ${column.color}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">{column.title}</h3>
                <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
                  {columnOrders.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {columnOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 truncate">{order.customer_name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status as keyof typeof statusColors]}`}>
                        {statusMap[order.status as keyof typeof statusMap]}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{order.customer_email}</p>
                    <p className="text-lg font-semibold text-green-600 mb-2">{formatCurrency(order.total_amount)}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <button className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm">
                        <FiEye size={14} />
                        Visualizar
                      </button>
                      
                      {/* Menu de Ações */}
                      <div className="relative">
                        <button
                          onClick={() => setShowActionsMenu(showActionsMenu === order.id ? null : order.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                          disabled={isLoadingAction}
                        >
                          <FiMoreVertical size={14} />
                        </button>
                        
                        {showActionsMenu === order.id && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[140px]">
                            <button
                              onClick={() => handleDownloadPDF(order.id)}
                              disabled={isLoadingAction}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              <FiDownload size={12} />
                              Baixar PDF
                            </button>
                            <button
                              onClick={() => handleSendWhatsApp(order.id)}
                              disabled={isLoadingAction}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              <FiMessageCircle size={12} />
                              WhatsApp
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTableView = () => {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('customer_name')}
                >
                  Cliente {sortField === 'customer_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('total_amount')}
                >
                  Valor Total {sortField === 'total_amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  Data {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('seller_id')}
                >
                  Vendedor {sortField === 'seller_id' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">{order.customer_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status as keyof typeof statusColors]}`}>
                      {statusMap[order.status as keyof typeof statusMap]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Vendedor #{order.seller_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                        <FiEye size={14} />
                        Visualizar
                      </button>
                      
                      {/* Menu de Ações */}
                      <div className="relative">
                        <button
                          onClick={() => setShowActionsMenu(showActionsMenu === order.id ? null : order.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                          disabled={isLoadingAction}
                        >
                          <FiMoreVertical size={16} />
                        </button>
                        
                        {showActionsMenu === order.id && (
                          <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[160px]">
                            <button
                              onClick={() => handleDownloadPDF(order.id)}
                              disabled={isLoadingAction}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              <FiDownload size={14} />
                              Baixar PDF
                            </button>
                            <button
                              onClick={() => handleSendWhatsApp(order.id)}
                              disabled={isLoadingAction}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              <FiMessageCircle size={14} />
                              Enviar por WhatsApp
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline de Vendas</h1>
          <p className="text-gray-600">Visualização geral dos orçamentos e vendas</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'kanban'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiGrid size={16} />
            Kanban
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiList size={16} />
            Tabela
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiGrid className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Orçamentos Novos</p>
              <p className="text-2xl font-semibold text-gray-900">
                {getOrdersByStatus('ORCAMENTO_NOVO').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiGrid className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Orçamentos Enviados</p>
              <p className="text-2xl font-semibold text-gray-900">
                {getOrdersByStatus('ORCAMENTO_ENVIADO').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiGrid className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vendidos</p>
              <p className="text-2xl font-semibold text-gray-900">
                {getOrdersByStatus('VENDIDO').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiGrid className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cancelados</p>
              <p className="text-2xl font-semibold text-gray-900">
                {getOrdersByStatus('CANCELADO').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? renderKanbanView() : renderTableView()}
      
      {/* Overlay para fechar menu ao clicar fora */}
      {showActionsMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowActionsMenu(null)}
        />
      )}
    </div>
  );
}