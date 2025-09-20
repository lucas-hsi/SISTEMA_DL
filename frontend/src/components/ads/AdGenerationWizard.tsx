'use client';

import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiSave, FiZap, FiCheck, FiAlertCircle } from 'react-icons/fi';
import AdForm from './AdForm';
import AdPreview from './AdPreview';
import useAdGeneration from '@/hooks/useAdGeneration';
import useAds from '@/hooks/useAds';
import useFormPreservation from '@/hooks/useFormPreservation';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  attributes: Record<string, any>;
}

interface AdData {
  title: string;
  subtitle: string;
  bullet_points: string[];
  description: string;
  category_path: string;
  price_strategy: string;
  price_value?: number;
  marketplace: string;
  product_id?: number;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isValid: (data: any) => boolean;
}

interface AdGenerationWizardProps {
  productId?: number;
  onSave?: (adData: AdData) => void;
  onCancel?: () => void;
  className?: string;
}

const AdGenerationWizard = ({ 
  productId, 
  onSave, 
  onCancel, 
  className = '' 
}: AdGenerationWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [adData, setAdData] = useState<AdData>({
    title: '',
    subtitle: '',
    bullet_points: [],
    description: '',
    category_path: '',
    price_strategy: 'competitive',
    marketplace: 'mercadolivre',
    product_id: productId
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    generatedContent,
    isGenerating,
    generateContent,
    previewAd,
    validateGeneration,
    clearGeneration
  } = useAdGeneration();

  const { createNewAd } = useAds();
  
  const formPreservation = useFormPreservation<AdData>();
  const { preserveFormData, restoreData, clearPreservedData, hasPreservedData } = formPreservation;

  // Verificar se há dados preservados ao carregar
  useEffect(() => {
    const loadData = async () => {
      try {
        const restored = await restoreData();
        if (restored.formData) {
          setAdData(restored.formData);
        }
      } catch (error) {
        console.error('Erro ao restaurar dados:', error);
      }
    };
    
    loadData();
  }, [restoreData]);

  // Preservar dados quando mudarem
  useEffect(() => {
    preserveFormData(adData);
  }, [adData, preserveFormData]);

  // Componente para seleção de produto
  const ProductStep = ({ onProductSelect }: { onProductSelect: (product: Product) => void }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    // Mock de produtos - em produção viria da API
    useEffect(() => {
      setLoading(true);
      // Simular busca de produtos
      setTimeout(() => {
        const mockProducts: Product[] = [
          {
            id: 1,
            name: 'Filtro de Óleo Automotivo',
            description: 'Filtro de óleo para motores 1.0 a 2.0',
            price: 25.90,
            category: 'Filtros > Óleo',
            images: ['/images/filtro-oleo.jpg'],
            attributes: { marca: 'Tecfil', modelo: 'PL358' }
          },
          {
            id: 2,
            name: 'Pastilha de Freio Dianteira',
            description: 'Pastilha de freio cerâmica premium',
            price: 89.90,
            category: 'Freios > Pastilhas',
            images: ['/images/pastilha-freio.jpg'],
            attributes: { marca: 'Bosch', aplicacao: 'Gol, Palio, Uno' }
          }
        ];
        setProducts(mockProducts);
        setLoading(false);
      }, 1000);
    }, [searchQuery]);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selecionar Produto</h3>
          <p className="text-gray-600">Escolha o produto para o qual deseja criar o anúncio.</p>
        </div>
        
        <div>
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Carregando produtos...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedProduct?.id === product.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedProduct(product);
                  onProductSelect(product);
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Componente para dados do anúncio
  const AdDataStep = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dados do Anúncio</h3>
          <p className="text-gray-600">Configure as informações básicas do anúncio.</p>
        </div>
        
        <AdForm
          initialData={adData}
          onSubmit={(data) => setAdData(data)}
          mode="create"
        />
      </div>
    );
  };

  // Componente para compatibilidades
  const CompatibilityStep = () => {
    const [compatibilities, setCompatibilities] = useState<string[]>(
      adData.bullet_points || []
    );
    const [newCompatibility, setNewCompatibility] = useState('');

    const addCompatibility = () => {
      if (newCompatibility.trim() && !compatibilities.includes(newCompatibility.trim())) {
        const updated = [...compatibilities, newCompatibility.trim()];
        setCompatibilities(updated);
        setAdData(prev => ({ ...prev, bullet_points: updated }));
        setNewCompatibility('');
      }
    };

    const removeCompatibility = (index: number) => {
      const updated = compatibilities.filter((_, i) => i !== index);
      setCompatibilities(updated);
      setAdData(prev => ({ ...prev, bullet_points: updated }));
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Compatibilidades</h3>
          <p className="text-gray-600">Adicione as compatibilidades e características do produto.</p>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: Gol 1.0 2010-2015"
            value={newCompatibility}
            onChange={(e) => setNewCompatibility(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCompatibility()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={addCompatibility}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Adicionar
          </button>
        </div>
        
        <div className="space-y-2">
          {compatibilities.map((compatibility, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-900">{compatibility}</span>
              <button
                onClick={() => removeCompatibility(index)}
                className="text-red-600 hover:text-red-800"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
        
        {compatibilities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhuma compatibilidade adicionada ainda.</p>
            <p className="text-sm mt-1">Use o campo acima para adicionar compatibilidades.</p>
          </div>
        )}
      </div>
    );
  };

  // Componente para mídias
  const MediaStep = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Mídias</h3>
          <p className="text-gray-600">Gerencie as imagens do produto para o anúncio.</p>
        </div>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500">Upload de imagens será implementado aqui</p>
          <p className="text-sm text-gray-400 mt-1">Por enquanto, usando imagens do produto selecionado</p>
        </div>
        
        {selectedProduct?.images && selectedProduct.images.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Imagens do Produto</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedProduct.images.map((image, index) => (
                <div key={index} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Imagem {index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Componente para preço
  const PriceStep = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Estratégia de Preço</h3>
          <p className="text-gray-600">Configure a estratégia de precificação para o anúncio.</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estratégia
            </label>
            <select
              value={adData.price_strategy}
              onChange={(e) => setAdData(prev => ({ ...prev, price_strategy: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="competitive">Competitivo</option>
              <option value="premium">Premium</option>
              <option value="budget">Econômico</option>
              <option value="fixed">Preço Fixo</option>
            </select>
          </div>
          
          {adData.price_strategy === 'fixed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={adData.price_value || ''}
                onChange={(e) => setAdData(prev => ({ 
                  ...prev, 
                  price_value: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0,00"
              />
            </div>
          )}
          
          {selectedProduct && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Preço de Referência</h4>
              <p className="text-blue-800">
                Produto: R$ {selectedProduct.price.toFixed(2).replace('.', ',')}
              </p>
              {adData.price_strategy !== 'fixed' && (
                <p className="text-sm text-blue-600 mt-1">
                  O preço final será calculado automaticamente baseado na estratégia selecionada.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Componente para revisão
  const ReviewStep = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Revisão Final</h3>
          <p className="text-gray-600">Revise todas as informações antes de salvar o anúncio.</p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Resumo dos dados */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Resumo do Anúncio</h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Título</label>
                <p className="text-gray-900">{adData.title || 'Não informado'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Subtítulo</label>
                <p className="text-gray-900">{adData.subtitle || 'Não informado'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Marketplace</label>
                <p className="text-gray-900">{adData.marketplace}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Estratégia de Preço</label>
                <p className="text-gray-900">
                  {adData.price_strategy}
                  {adData.price_value && ` - R$ ${adData.price_value.toFixed(2).replace('.', ',')}`}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Compatibilidades</label>
                <p className="text-gray-900">
                  {adData.bullet_points.length} item(s)
                </p>
              </div>
            </div>
            
            {/* Validação */}
            {validationResults && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Validação</h4>
                <div className="space-y-2">
                  {validationResults.errors?.map((error: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-red-600">
                      <FiAlertCircle size={16} />
                      <span className="text-sm">{error}</span>
                    </div>
                  ))}
                  {validationResults.warnings?.map((warning: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-yellow-600">
                      <FiAlertCircle size={16} />
                      <span className="text-sm">{warning}</span>
                    </div>
                  ))}
                  {validationResults.isValid && (
                    <div className="flex items-center gap-2 text-green-600">
                      <FiCheck size={16} />
                      <span className="text-sm">Anúncio válido e pronto para publicação</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Preview */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Preview</h4>
            <AdPreview
              adData={adData}
              productData={selectedProduct || undefined}
              className="max-h-96 overflow-y-auto"
            />
          </div>
        </div>
      </div>
    );
  };

  // Definição dos passos
  const steps: WizardStep[] = [
    {
      id: 'product',
      title: 'Produto',
      description: 'Selecione o produto',
      component: ProductStep,
      isValid: () => !!selectedProduct
    },
    {
      id: 'data',
      title: 'Dados',
      description: 'Informações básicas',
      component: AdDataStep,
      isValid: () => !!(adData.title && adData.marketplace)
    },
    {
      id: 'compatibility',
      title: 'Compatibilidades',
      description: 'Características do produto',
      component: CompatibilityStep,
      isValid: () => adData.bullet_points.length > 0
    },
    {
      id: 'media',
      title: 'Mídias',
      description: 'Imagens e vídeos',
      component: MediaStep,
      isValid: () => true // Por enquanto sempre válido
    },
    {
      id: 'price',
      title: 'Preço',
      description: 'Estratégia de precificação',
      component: PriceStep,
      isValid: () => !!(adData.price_strategy && (adData.price_strategy !== 'fixed' || adData.price_value))
    },
    {
      id: 'review',
      title: 'Revisão',
      description: 'Validação final',
      component: ReviewStep,
      isValid: () => true
    }
  ];

  const currentStepData = steps[currentStep];
  const isStepValid = currentStepData.isValid(adData);
  const canGoNext = currentStep < steps.length - 1 && isStepValid;
  const canGoPrev = currentStep > 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (canGoNext) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!selectedProduct) return;
    
    const request = {
      product_id: selectedProduct.id,
      marketplace: adData.marketplace,
      price_strategy: adData.price_strategy,
      ...(adData.price_value && { price_value: adData.price_value })
    };
    
    const result = await generateContent(request);
    if (result) {
      setAdData(prev => ({
        ...prev,
        title: result.title || prev.title,
        subtitle: result.subtitle || prev.subtitle,
        description: result.description || prev.description,
        bullet_points: result.bullet_points || prev.bullet_points,
        category_path: result.category_path || prev.category_path
      }));
    }
  };

  const handleValidate = async () => {
    const result = await validateGeneration(adData);
    setValidationResults(result);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await createNewAd(adData);
      if (success) {
        clearPreservedData();
        if (onSave) {
          onSave(adData);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const CurrentStepComponent = currentStepData.component;

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header com progresso */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Gerar Anúncio</h2>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateWithAI}
              disabled={!selectedProduct || isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiZap size={16} className={isGenerating ? 'animate-pulse' : ''} />
              {isGenerating ? 'Gerando...' : 'Gerar com IA'}
            </button>
            
            {isLastStep && (
              <button
                onClick={handleValidate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FiCheck size={16} />
                Validar
              </button>
            )}
          </div>
        </div>
        
        {/* Indicador de progresso */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index === currentStep
                  ? 'bg-blue-600 text-white'
                  : index < currentStep
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index < currentStep ? <FiCheck size={16} /> : index + 1}
              </div>
              <div className="ml-2 hidden sm:block">
                <p className={`text-sm font-medium ${
                  index === currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-400">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-4 ${
                  index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Conteúdo do passo atual */}
      <div className="p-6">
        <CurrentStepComponent 
          onProductSelect={setSelectedProduct}
          adData={adData}
          onChange={setAdData}
          selectedProduct={selectedProduct}
        />
      </div>
      
      {/* Footer com navegação */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex gap-2">
          {canGoPrev && (
            <button
              onClick={handlePrev}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FiChevronLeft size={16} />
              Anterior
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
          
          {isLastStep ? (
            <button
              onClick={handleSave}
              disabled={!isStepValid || isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave size={16} className={isSaving ? 'animate-pulse' : ''} />
              {isSaving ? 'Salvando...' : 'Salvar Anúncio'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
              <FiChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdGenerationWizard;
export type { AdGenerationWizardProps, AdData, Product };