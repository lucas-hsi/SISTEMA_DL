'use client';

import { useState } from 'react';
import { FiShoppingCart, FiEye, FiMoreVertical, FiDownload, FiMessageCircle } from 'react-icons/fi';
import { downloadOrderPDF, sendWhatsAppMessage, getOrderActionData } from '@/services/orderActions';

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  status: string;
  total_amount: number;
  created_at: string;
  seller_id: number;
}

interface TableViewProps {
  orders: Order[];
  onConvert?: (orderId: number) => Promise<void>;
  showConvertButton?: boolean;
  sortField: keyof Order;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Order) => void;
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

export default function TableView({ 
  orders, 
  onConvert, 
  showConvertButton = false, 
  sortField, 
  sortDirection, 
  onSort 
}: TableViewProps) {
  const [showActionsMenu, setShowActionsMenu] = useState<number | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleConvert = async (orderId: number) => {
    if (!onConvert) return;
    
    try {
      await onConvert(orderId);
      console.log('Orçamento convertido em venda com sucesso!');
    } catch (error) {
      console.error('Erro ao converter orçamento:', error);
      console.error('Erro ao converter orçamento em venda');
    }
  };

  const canConvert = (status: string) => {
    return showConvertButton && (status === 'ORCAMENTO_NOVO' || status === 'ORCAMENTO_ENVIADO');
  };

  const getSortIcon = (field: keyof Order) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? '↑' : '↓';
    }
    return '';
  };

  const handleDownloadPDF = async (orderId: number) => {
    setIsLoadingAction(true);
    try {
      await downloadOrderPDF(orderId);
      setShowActionsMenu(null);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      alert('Erro ao baixar PDF do orçamento');
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
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      alert('Erro ao abrir WhatsApp. Verifique se o cliente possui telefone cadastrado.');
    } finally {
      setIsLoadingAction(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('id')}
              >
                ID {getSortIcon('id')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('customer_name')}
              >
                Cliente {getSortIcon('customer_name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('total_amount')}
              >
                Valor Total {getSortIcon('total_amount')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('created_at')}
              >
                Data {getSortIcon('created_at')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('seller_id')}
              >
                Vendedor {getSortIcon('seller_id')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map(order => (
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
                    {canConvert(order.status) && (
                      <button
                        onClick={() => handleConvert(order.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <FiShoppingCart size={14} />
                        Converter em Venda
                      </button>
                    )}
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
        
        {orders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum orçamento encontrado</p>
          </div>
        )}
      </div>
      
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