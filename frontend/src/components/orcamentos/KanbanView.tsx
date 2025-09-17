'use client';

import KanbanCard from './KanbanCard';

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  status: string;
  total_amount: number;
  created_at: string;
  seller_id: number;
}

interface KanbanViewProps {
  orders: Order[];
  onConvert?: (orderId: number) => Promise<void>;
  showConvertButton?: boolean;
}

export default function KanbanView({ orders, onConvert, showConvertButton = false }: KanbanViewProps) {
  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

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
                <KanbanCard
                  key={order.id}
                  order={order}
                  onConvert={onConvert}
                  showConvertButton={showConvertButton}
                />
              ))}
              
              {columnOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Nenhum orçamento nesta etapa</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}