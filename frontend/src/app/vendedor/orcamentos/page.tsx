'use client';

import { useState, useEffect } from 'react';
import { FiGrid, FiList } from 'react-icons/fi';
import api from '@/lib/api';
import KanbanView from '@/components/orcamentos/KanbanView';
import TableView from '@/components/orcamentos/TableView';

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  status: string;
  total_amount: number;
  created_at: string;
  seller_id: number;
}

type ViewMode = 'kanban' | 'table';

const statusConfig = {
  'Orçamento Novo': {
    color: 'bg-blue-100 text-blue-800',
    canConvert: true
  },
  'Orçamento Enviado': {
    color: 'bg-yellow-100 text-yellow-800',
    canConvert: true
  },
  'Vendido': {
    color: 'bg-green-100 text-green-800',
    canConvert: false
  },
  'Cancelado': {
    color: 'bg-red-100 text-red-800',
    canConvert: false
  }
};

const statusColumns = ['Orçamento Novo', 'Orçamento Enviado', 'Vendido', 'Cancelado'];

export default function OrcamentosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [sortField, setSortField] = useState<keyof Order>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
      console.error('Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
    }
  };

  const convertToSale = async (orderId: number) => {
    try {
      await api.post(`/api/v1/orders/${orderId}/convert-to-sale`);
      
      // Atualizar a lista de orçamentos
      await fetchOrders();
    } catch (error) {
      console.error('Erro ao converter orçamento:', error);
      throw error; // Re-throw para que o componente possa tratar
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline de Vendas</h1>
          <p className="text-gray-600 mt-1">Gerencie seus orçamentos e vendas</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'kanban'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiGrid size={16} />
            Kanban
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiList size={16} />
            Tabela
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        <KanbanView 
          orders={sortedOrders} 
          onConvert={convertToSale} 
          showConvertButton={true} 
        />
      ) : (
        <TableView 
          orders={sortedOrders} 
          onConvert={convertToSale} 
          showConvertButton={true}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      )}
    </div>
  );
}