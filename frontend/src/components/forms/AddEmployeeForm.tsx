'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { FiUser, FiMail, FiLock, FiUserCheck } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';

interface AddEmployeeFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  full_name: string;
  email: string;
  password: string;
  role: 'vendedor' | 'anuncios';
}

const AddEmployeeForm = ({ onClose, onSuccess }: AddEmployeeFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    password: '',
    role: 'vendedor'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { companyId } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Verificar se o company_id está disponível
      if (!companyId) {
        throw new Error('Company ID não encontrado no perfil do usuário');
      }

      // Preparar dados para envio
      const payload = {
        ...formData,
        company_id: companyId,
        is_active: true
      };

      // Chamar API para criar funcionário
      await api.post('/api/v1/users/', payload);

      // Sucesso - fechar modal e atualizar lista
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao criar funcionário:', err);
      setError(
        err.response?.data?.detail || 
        err.message || 
        'Erro ao criar funcionário. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Adicionar Novo Funcionário</h2>
        <p className="text-sm text-gray-600 mt-1">Preencha os dados do novo funcionário</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Nome Completo */}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
          Nome Completo
        </label>
        <div className="relative">
          <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            required
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            placeholder="Digite o nome completo"
          />
        </div>
      </div>

      {/* E-mail */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          E-mail
        </label>
        <div className="relative">
          <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            placeholder="Digite o e-mail"
          />
        </div>
      </div>

      {/* Senha */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Senha
        </label>
        <div className="relative">
          <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            minLength={6}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            placeholder="Digite a senha (mín. 6 caracteres)"
          />
        </div>
      </div>

      {/* Perfil (Role) */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
          Perfil
        </label>
        <div className="relative">
          <FiUserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            required
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 appearance-none bg-white"
          >
            <option value="vendedor">Vendedor</option>
            <option value="anuncios">Anúncios</option>
          </select>
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
        >
          {isLoading ? 'Criando...' : 'Criar Funcionário'}
        </button>
      </div>
    </form>
  );
};

export default AddEmployeeForm;