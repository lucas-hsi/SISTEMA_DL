import api from '@/lib/api';

interface OrderActionData {
  id: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
}

/**
 * Baixa o PDF de um orçamento
 */
export const downloadOrderPDF = async (orderId: number): Promise<void> => {
  try {
    const response = await api.get(`/orders/${orderId}/pdf`, {
      responseType: 'blob'
    });

    // Criar URL temporária para o blob
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    // Criar link temporário e simular clique para download
    const link = document.createElement('a');
    link.href = url;
    link.download = `orcamento_${orderId}.pdf`;
    document.body.appendChild(link);
    link.click();

    // Limpar recursos
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao baixar PDF:', error);
    throw new Error('Erro ao baixar o PDF do orçamento');
  }
};

/**
 * Abre WhatsApp com mensagem pré-definida para o cliente
 */
export const sendWhatsAppMessage = async (orderData: OrderActionData): Promise<void> => {
  try {
    // Buscar dados completos do cliente se necessário
    let customerPhone = orderData.customer_phone;
    
    if (!customerPhone) {
      // Se não temos o telefone, buscar dados do cliente via API
      const response = await api.get(`/orders/${orderData.id}`);
      
      // Assumindo que a resposta inclui dados do cliente
      customerPhone = response.data.client?.phone;
    }

    if (!customerPhone) {
      throw new Error('Telefone do cliente não encontrado');
    }

    // Limpar telefone (remover caracteres especiais)
    const cleanPhone = customerPhone.replace(/\D/g, '');
    
    // Garantir que o telefone tenha o código do país (55 para Brasil)
    const phoneWithCountryCode = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    // Mensagem pré-definida
    const message = encodeURIComponent(
      `Olá, ${orderData.customer_name}! Segue o seu orçamento da DL Auto Peças.`
    );

    // Abrir WhatsApp em nova aba
    const whatsappUrl = `https://wa.me/${phoneWithCountryCode}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  } catch (error) {
    console.error('Erro ao abrir WhatsApp:', error);
    throw new Error('Erro ao abrir WhatsApp. Verifique se o cliente possui telefone cadastrado.');
  }
};

/**
 * Busca dados completos do orçamento para ações
 */
export const getOrderActionData = async (orderId: number): Promise<OrderActionData> => {
  try {
    const response = await api.get(`/orders/${orderId}`);

    return {
      id: response.data.id,
      customer_name: response.data.client?.name || 'Cliente',
      customer_email: response.data.client?.email,
      customer_phone: response.data.client?.phone
    };
  } catch (error) {
    console.error('Erro ao buscar dados do orçamento:', error);
    throw new Error('Erro ao buscar dados do orçamento');
  }
};