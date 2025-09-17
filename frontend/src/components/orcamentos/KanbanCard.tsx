'use client';

import { useState } from 'react';
import { FiShoppingCart, FiMoreVertical, FiDownload, FiMessageCircle } from 'react-icons/fi';
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

interface KanbanCardProps {
  order: Order;
  onConvert?: (orderId: number) => Promise<void>;
  showConvertButton?: boolean;
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

export default function KanbanCard({ order, onConvert, showConvertButton = false }: KanbanCardProps) {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
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

  const handleConvert = async () => {
    if (!onConvert) return;
    
    try {
      await onConvert(order.id);
      console.log('Orçamento convertido em venda com sucesso!');
    } catch (error) {
      console.error('Erro ao converter orçamento:', error);
      console.error('Erro ao converter orçamento em venda');
    }
  };

  const handleDownloadPDF = async () => {
    setIsLoadingAction(true);
    try {
      await downloadOrderPDF(order.id);
      setShowActionsMenu(false);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      alert('Erro ao baixar PDF do orçamento');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleSendWhatsApp = async () => {
    setIsLoadingAction(true);
    try {
      const orderData = await getOrderActionData(order.id);
      await sendWhatsAppMessage(orderData);
      setShowActionsMenu(false);
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      alert('Erro ao abrir WhatsApp. Verifique se o cliente possui telefone cadastrado.');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const canConvert = showConvertButton && (order.status === 'ORCAMENTO_NOVO' || order.status === 'ORCAMENTO_ENVIADO');

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 truncate">{order.customer_name}</h4>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status as keyof typeof statusColors]}`}>
            {statusMap[order.status as keyof typeof statusMap]}
          </span>
          
          {/* Menu de Ações */}
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
              disabled={isLoadingAction}
            >
              <FiMoreVertical size={16} />
            </button>
            
            {showActionsMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[160px]">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isLoadingAction}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <FiDownload size={14} />
                  Baixar PDF
                </button>
                <button
                  onClick={handleSendWhatsApp}
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
      </div>
      
      <p className="text-sm text-gray-600 mb-2">{order.customer_email}</p>
      <p className="text-lg font-semibold text-green-600 mb-2">{formatCurrency(order.total_amount)}</p>
      <p className="text-xs text-gray-500 mb-3">{formatDate(order.created_at)}</p>
      
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Vendedor #{order.seller_id}</span>
        
        {canConvert && (
          <button
            onClick={handleConvert}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <FiShoppingCart size={14} />
            Converter em Venda
          </button>
        )}
      </div>
      
      {/* Overlay para fechar menu ao clicar fora */}
      {showActionsMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowActionsMenu(false)}
        />
      )}
    </div>
  );
}