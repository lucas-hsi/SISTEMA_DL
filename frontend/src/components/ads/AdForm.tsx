'use client';

import { useState, useEffect } from 'react';
import { FiEdit3, FiTag, FiDollarSign, FiGlobe } from 'react-icons/fi';

interface AdFormData {
  title: string;
  subtitle: string;
  description: string;
  bullet_points: string[];
  category_path: string;
  price_strategy: string;
  price_value?: number;
  marketplace: string;
  product_id?: number;
}

interface AdFormProps {
  initialData?: Partial<AdFormData>;
  onSubmit: (data: AdFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
  className?: string;
}

const AdForm = ({ 
  initialData = {}, 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  mode = 'create',
  className = '' 
}: AdFormProps) => {
  const [formData, setFormData] = useState<AdFormData>({
    title: '',
    subtitle: '',
    description: '',
    bullet_points: [''],
    category_path: '',
    price_strategy: 'competitive',
    price_value: undefined,
    marketplace: 'mercadolivre',
    product_id: undefined,
    ...initialData
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof AdFormData, string>>>({});
  const [bulletPointInput, setBulletPointInput] = useState('');

  // Opções para os selects
  const marketplaces = [
    { value: 'mercadolivre', label: 'Mercado Livre' },
    { value: 'shopee', label: 'Shopee' },
    { value: 'amazon', label: 'Amazon' },
    { value: 'magalu', label: 'Magazine Luiza' }
  ];

  const priceStrategies = [
    { value: 'competitive', label: 'Competitivo' },
    { value: 'premium', label: 'Premium' },
    { value: 'budget', label: 'Econômico' },
    { value: 'fixed', label: 'Preço Fixo' }
  ];

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AdFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Título deve ter pelo menos 10 caracteres';
    } else if (formData.title.length > 60) {
      newErrors.title = 'Título deve ter no máximo 60 caracteres';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Descrição deve ter pelo menos 50 caracteres';
    }

    if (!formData.category_path.trim()) {
      newErrors.category_path = 'Caminho da categoria é obrigatório';
    }

    if (formData.bullet_points.filter(point => point.trim()).length < 2) {
      newErrors.bullet_points = 'Adicione pelo menos 2 características';
    }

    if (formData.price_strategy === 'fixed' && (!formData.price_value || formData.price_value <= 0)) {
      newErrors.price_value = 'Preço é obrigatório para estratégia de preço fixo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price_value' ? (value ? parseFloat(value) : undefined) : value
    }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name as keyof AdFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const addBulletPoint = () => {
    if (bulletPointInput.trim() && formData.bullet_points.length < 10) {
      setFormData(prev => ({
        ...prev,
        bullet_points: [...prev.bullet_points.filter(p => p.trim()), bulletPointInput.trim()]
      }));
      setBulletPointInput('');
      
      if (errors.bullet_points) {
        setErrors(prev => ({ ...prev, bullet_points: undefined }));
      }
    }
  };

  const removeBulletPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bullet_points: prev.bullet_points.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Filtrar bullet points vazios
      const cleanedData = {
        ...formData,
        bullet_points: formData.bullet_points.filter(point => point.trim())
      };
      onSubmit(cleanedData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FiEdit3 className="inline mr-2" />
          Título do Anúncio *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Ex: Peça Original Honda Civic 2020 - Qualidade Garantida"
          maxLength={60}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        <p className="text-gray-500 text-xs mt-1">{formData.title.length}/60 caracteres</p>
      </div>

      {/* Subtítulo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subtítulo (opcional)
        </label>
        <input
          type="text"
          name="subtitle"
          value={formData.subtitle}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ex: Entrega rápida e garantia de 1 ano"
          maxLength={100}
        />
        <p className="text-gray-500 text-xs mt-1">{formData.subtitle.length}/100 caracteres</p>
      </div>

      {/* Marketplace */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FiGlobe className="inline mr-2" />
          Marketplace *
        </label>
        <select
          name="marketplace"
          value={formData.marketplace}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {marketplaces.map(marketplace => (
            <option key={marketplace.value} value={marketplace.value}>
              {marketplace.label}
            </option>
          ))}
        </select>
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={6}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Descreva detalhadamente o produto, suas características, benefícios e diferenciais..."
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        <p className="text-gray-500 text-xs mt-1">{formData.description.length} caracteres (mínimo 50)</p>
      </div>

      {/* Características (Bullet Points) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FiTag className="inline mr-2" />
          Características Destacadas *
        </label>
        
        {/* Lista de bullet points */}
        {formData.bullet_points.filter(p => p.trim()).length > 0 && (
          <div className="mb-3 space-y-2">
            {formData.bullet_points.filter(p => p.trim()).map((point, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="flex-1">• {point}</span>
                <button
                  type="button"
                  onClick={() => removeBulletPoint(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Input para adicionar novo bullet point */}
        <div className="flex gap-2">
          <input
            type="text"
            value={bulletPointInput}
            onChange={(e) => setBulletPointInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBulletPoint())}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Material resistente e durável"
            maxLength={100}
          />
          <button
            type="button"
            onClick={addBulletPoint}
            disabled={!bulletPointInput.trim() || formData.bullet_points.length >= 10}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Adicionar
          </button>
        </div>
        {errors.bullet_points && <p className="text-red-500 text-sm mt-1">{errors.bullet_points}</p>}
        <p className="text-gray-500 text-xs mt-1">
          {formData.bullet_points.filter(p => p.trim()).length}/10 características
        </p>
      </div>

      {/* Caminho da Categoria */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Caminho da Categoria *
        </label>
        <input
          type="text"
          name="category_path"
          value={formData.category_path}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.category_path ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Ex: Veículos > Peças e Acessórios > Motor"
        />
        {errors.category_path && <p className="text-red-500 text-sm mt-1">{errors.category_path}</p>}
      </div>

      {/* Estratégia de Preço */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiDollarSign className="inline mr-2" />
            Estratégia de Preço *
          </label>
          <select
            name="price_strategy"
            value={formData.price_strategy}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {priceStrategies.map(strategy => (
              <option key={strategy.value} value={strategy.value}>
                {strategy.label}
              </option>
            ))}
          </select>
        </div>

        {/* Valor do Preço (condicional) */}
        {formData.price_strategy === 'fixed' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor do Preço *
            </label>
            <input
              type="number"
              name="price_value"
              value={formData.price_value || ''}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.price_value ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.price_value && <p className="text-red-500 text-sm mt-1">{errors.price_value}</p>}
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Salvando...' : mode === 'edit' ? 'Atualizar Anúncio' : 'Criar Anúncio'}
        </button>
      </div>
    </form>
  );
};

export default AdForm;
export type { AdFormData, AdFormProps };