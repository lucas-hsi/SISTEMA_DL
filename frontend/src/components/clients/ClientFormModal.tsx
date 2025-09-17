'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Client } from './ClientTable';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface ClientFormData {
  name: string;
  client_type: string;
  lead_status: string;
  lead_origin: string;
  contact_person: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  notes: string;
}

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  client?: Client;
  onSuccess: () => void;
}

const ClientFormModal = ({ isOpen, onClose, mode, client, onSuccess }: ClientFormModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    client_type: 'Cliente Final',
    lead_status: 'Neutro',
    lead_origin: 'Site',
    contact_person: '',
    email: '',
    phone: '',
    document: '',
    address: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ClientFormData>>({});

  // Opções para os selects
  const clientTypes = ['Cliente Final', 'Latoeiro', 'Mecânico'];
  const leadStatuses = ['Quente', 'Neutro', 'Frio'];
  const leadOrigins = ['Site', 'Telefone', 'WhatsApp', 'Indicação', 'Redes Sociais', 'Outros'];

  // Preencher formulário quando estiver editando
  useEffect(() => {
    if (mode === 'edit' && client) {
      setFormData({
        name: client.name || '',
        client_type: client.client_type || 'Cliente Final',
        lead_status: client.lead_status || 'Neutro',
        lead_origin: client.lead_origin || 'Site',
        contact_person: client.contact_person || '',
        email: client.email || '',
        phone: client.phone || '',
        document: client.document || '',
        address: client.address || '',
        notes: client.notes || ''
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        client_type: 'Cliente Final',
        lead_status: 'Neutro',
        lead_origin: 'Site',
        contact_person: '',
        email: '',
        phone: '',
        document: '',
        address: '',
        notes: ''
      });
    }
    setErrors({});
  }, [mode, client, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof ClientFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ClientFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.phone && !/^[\d\s\(\)\-\+]+$/.test(formData.phone)) {
      newErrors.phone = 'Telefone inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const payload = {
        ...formData,
        company_id: user?.company_id
      };

      if (mode === 'create') {
        await api.post('/clients', payload);
      } else if (mode === 'edit' && client) {
        await api.put(`/clients/${client.id}`, payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      
      // Handle validation errors from backend
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          alert(error.response.data.detail);
        } else {
          alert('Erro ao salvar cliente. Verifique os dados e tente novamente.');
        }
      } else {
        alert('Erro ao salvar cliente. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Adicionar Cliente' : 'Editar Cliente'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Nome */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Nome *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
              errors.name ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
            }`}
            placeholder="Nome do cliente"
            disabled={isLoading}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Tipo de Cliente e Status Lead */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="client_type" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Tipo de Cliente
            </label>
            <select
              id="client_type"
              name="client_type"
              value={formData.client_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              disabled={isLoading}
            >
              {clientTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="lead_status" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Status do Lead
            </label>
            <select
              id="lead_status"
              name="lead_status"
              value={formData.lead_status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              disabled={isLoading}
            >
              {leadStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Origem do Lead e Pessoa de Contato */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="lead_origin" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Origem do Lead
            </label>
            <select
              id="lead_origin"
              name="lead_origin"
              value={formData.lead_origin}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              disabled={isLoading}
            >
              {leadOrigins.map(origin => (
                <option key={origin} value={origin}>{origin}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Pessoa de Contato
            </label>
            <input
              type="text"
              id="contact_person"
              name="contact_person"
              value={formData.contact_person}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              placeholder="Nome da pessoa de contato"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Email e Telefone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                errors.email ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
              }`}
              placeholder="email@exemplo.com"
              disabled={isLoading}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white ${
                errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
              }`}
              placeholder="(11) 99999-9999"
              disabled={isLoading}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </div>
        </div>

        {/* Documento */}
        <div>
          <label htmlFor="document" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Documento (CPF/CNPJ)
          </label>
          <input
            type="text"
            id="document"
            name="document"
            value={formData.document}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            disabled={isLoading}
          />
        </div>

        {/* Endereço */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Endereço
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            placeholder="Endereço completo"
            disabled={isLoading}
          />
        </div>

        {/* Observações */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Observações
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            placeholder="Observações adicionais sobre o cliente"
            disabled={isLoading}
          />
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-600">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Salvando...' : mode === 'create' ? 'Criar Cliente' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ClientFormModal;
export type { ClientFormModalProps, ClientFormData };