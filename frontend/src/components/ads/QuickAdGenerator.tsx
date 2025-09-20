'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { FiUpload, FiX, FiZap, FiDownload, FiSend, FiCheck, FiAlertCircle, FiImage, FiPackage } from 'react-icons/fi';
import useQuickAds, { QuickGenerateRequest, QuickGenerateResponse } from '@/hooks/useQuickAds';
import { useAds } from '@/hooks/useAds';
import AdPreview from './AdPreview';

interface QuickAdGeneratorProps {
  className?: string;
  onAdGenerated?: (response: QuickGenerateResponse) => void;
}

const QuickAdGenerator = ({ className = '', onAdGenerated }: QuickAdGeneratorProps) => {
  // Mount guard para evitar incompatibilidade de hidratação SSR/CSR
  const [mounted, setMounted] = useState(false);

  // Estados do formulário
  const [partNumber, setPartNumber] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [marketplace, setMarketplace] = useState<'mercado_livre' | 'shopee' | 'amazon' | 'magalu'>('mercado_livre');
  const [processBackground, setProcessBackground] = useState(true);
  const [customPrompt, setCustomPrompt] = useState('');

  // Estados de resultado
  const [generatedAd, setGeneratedAd] = useState<QuickGenerateResponse | null>(null);
  const [adDetails, setAdDetails] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Hook para quick ads
  const { loading, error, fieldErrors, quickGenerate, createZip, publishAds, downloadZip, clearError } = useQuickAds();
  const { getAd } = useAds();

  // Effect para mount guard
  useEffect(() => {
    setMounted(true);
  }, []);

  // Ref para input de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Opções de marketplace
  const marketplaceOptions = [
    { value: 'mercado_livre', label: 'Mercado Livre', color: 'bg-yellow-500' },
    { value: 'shopee', label: 'Shopee', color: 'bg-orange-500' },
    { value: 'amazon', label: 'Amazon', color: 'bg-gray-900' },
    { value: 'magalu', label: 'Magazine Luiza', color: 'bg-blue-600' }
  ];

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            setImages(prev => {
              if (prev.length < 10) {
                return [...prev, result];
              }
              return prev;
            });
          }
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [images.length]);

  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!partNumber.trim()) {
      return;
    }

    const request: QuickGenerateRequest = {
      part_number: partNumber.trim(),
      images,
      marketplace,
      process_background: processBackground,
      custom_prompt: customPrompt.trim() || undefined
    };

    try {
      const response = await quickGenerate(request);
      if (response) {
        setGeneratedAd(response);
        
        // Buscar dados atualizados do anúncio via GET /ads/{id}
        if (response.ad_id) {
          try {
            const adData = await getAd(response.ad_id);
            setAdDetails(adData);
          } catch (adErr) {
            console.error('Erro ao buscar dados do anúncio:', adErr);
          }
        }
        
        setShowPreview(true);
        onAdGenerated?.(response);
      }
    } catch (err) {
      console.error('Erro ao gerar anúncio:', err);
    }
  }, [partNumber, images, marketplace, processBackground, customPrompt, quickGenerate, onAdGenerated]);

  const handleCreateZip = useCallback(async () => {
    if (!generatedAd?.ad_id) return;

    try {
      const response = await createZip({
        ad_ids: [generatedAd.ad_id],
        include_images: true,
        include_qr_codes: true
      });
      
      if (response?.download_url) {
        const filename = response.download_url.split('/').pop();
        if (filename) {
          await downloadZip(filename);
        }
      }
    } catch (err) {
      console.error('Erro ao criar ZIP:', err);
    }
  }, [generatedAd, createZip, downloadZip]);

  const handlePublish = useCallback(async () => {
    if (!generatedAd?.ad_id) return;

    try {
      await publishAds({
        ad_ids: [generatedAd.ad_id],
        marketplace
      });
    } catch (err) {
      console.error('Erro ao publicar anúncio:', err);
    }
  }, [generatedAd, marketplace, publishAds]);

  const resetForm = useCallback(() => {
    setPartNumber('');
    setImages([]);
    setMarketplace('mercado_livre');
    setProcessBackground(true);
    setCustomPrompt('');
    setGeneratedAd(null);
    setAdDetails(null);
    setShowPreview(false);
    clearError();
  }, [clearError]);

  // Renderizar skeleton enquanto não montado para evitar incompatibilidade SSR/CSR
  if (!mounted) {
    return (
      <div className={`bg-white rounded-lg shadow-lg min-h-[600px] ${className}`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 bg-gray-200 rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FiZap className="text-purple-600" />
              Gerador Rápido de Anúncios
            </h2>
            <p className="text-gray-600 mt-1">
              Gere anúncios automaticamente a partir do part number e imagens
            </p>
          </div>
          {generatedAd && (
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Novo Anúncio
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="text-center text-gray-600 mt-4">Gerando anúncio...</p>
        </div>
      )}

      {/* Formulário */}
      {!loading && (
        <div className="p-6 space-y-6">
          {/* Part Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Part Number *
            </label>
            <div className="relative">
              <FiPackage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Digite o part number do produto"
              />
            </div>
          </div>

          {/* Upload de Imagens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagens do Produto ({images.length}/10)
            </label>

            {/* Grid de imagens */}
            {images.length > 0 && (
              <div className="grid grid-cols-5 gap-3 mb-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Produto ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Botão de upload */}
            {images.length < 10 && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <FiUpload size={20} />
                  <span className="text-xs mt-1">Adicionar</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-sm text-gray-500">
                  Adicione até 10 imagens do produto (JPG, PNG, WebP)
                </p>
              </div>
            )}
          </div>

          {/* Marketplace */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marketplace de Destino
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {marketplaceOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMarketplace(option.value as any)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    marketplace === option.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${option.color}`} />
                    <span className="font-medium">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Opções avançadas */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="processBackground"
                checked={processBackground}
                onChange={(e) => setProcessBackground(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="processBackground" className="text-sm text-gray-700">
                Processar fundo das imagens (remover/deixar branco)
              </label>
            </div>

            <div>
              <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                Prompt Personalizado (Opcional)
              </label>
              <textarea
                id="customPrompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Instruções específicas para a geração do anúncio..."
              />
            </div>
          </div>

          {/* Botão de gerar */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleGenerate}
              disabled={!partNumber.trim() || loading}
              className="px-8 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Gerando...
                </>
              ) : (
                <>
                  <FiZap size={20} />
                  Gerar Anúncio
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Preview e Ações */}
      {generatedAd && (
        <div className="border-t border-gray-200 p-6 space-y-6">
          {/* Status da geração */}
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              {generatedAd.success ? (
                <FiCheck className="text-green-600" size={20} />
              ) : (
                <FiAlertCircle className="text-red-600" size={20} />
              )}
              <span className="font-medium text-green-800">
                {generatedAd.success ? 'Anúncio gerado com sucesso!' : 'Erro na geração'}
              </span>
            </div>
            {generatedAd.processing_time && (
              <span className="text-sm text-green-600">
                Processado em {generatedAd.processing_time}s
              </span>
            )}
          </div>

          {/* Informações do anúncio gerado */}
          {generatedAd.success && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Dados gerados */}
              <div>
                <h3 className="font-medium text-gray-900">Dados Gerados</h3>
                <div className="mt-3 space-y-2 text-sm">
                  {generatedAd.sku_generated && (
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700">SKU:</span>
                      <span className="ml-2 text-gray-600">{generatedAd.sku_generated}</span>
                    </div>
                  )}
                  {generatedAd.product_id && (
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700">Produto ID:</span>
                      <span className="ml-2 text-gray-600">{generatedAd.product_id}</span>
                    </div>
                  )}
                  {generatedAd.ad_id && (
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700">Anúncio ID:</span>
                      <span className="ml-2 text-gray-600">{generatedAd.ad_id}</span>
                    </div>
                  )}
                  {generatedAd.qr_code_path && (
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700">QR Code:</span>
                      <span className="ml-2 text-green-600">✓ Gerado</span>
                    </div>
                  )}
                  {generatedAd.processed_images && (
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700">Imagens:</span>
                      <span className="ml-2 text-gray-600">{generatedAd.processed_images.length} processadas</span>
                    </div>
                  )}
                </div>

                {/* Validações */}
                {generatedAd.validation_flags && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Validações</h4>
                    <div className="space-y-1">
                      {Object.entries(generatedAd.validation_flags).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          {value ? (
                            <FiCheck className="text-green-500" size={12} />
                          ) : (
                            <FiX className="text-red-500" size={12} />
                          )}
                          <span className="text-gray-600">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview */}
              <div data-slot="preview">
                <h3 className="font-medium text-gray-900 mb-3">Preview do Anúncio</h3>
                <AdPreview
                  adData={{
                    title: adDetails?.title || generatedAd.title || '',
                    description: adDetails?.description || generatedAd.description || '',
                    marketplace: marketplace,
                    ...(adDetails || {})
                  }}
                  className="max-h-96 overflow-y-auto"
                />
              </div>
            </div>
          )}

          {/* Ações */}
          {generatedAd.success && (
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCreateZip}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <FiDownload size={16} />
                Baixar ZIP
              </button>
              <button
                onClick={handlePublish}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <FiSend size={16} />
                Publicar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Erro - renderização segura apenas de strings */}
      {(error || (fieldErrors && fieldErrors.length > 0)) && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          {error && (
            <div className="flex items-center gap-2 mb-2">
              <FiAlertCircle className="text-red-600" size={16} />
              <p className="text-red-800 text-sm">{String(error)}</p>
            </div>
          )}
          {fieldErrors && fieldErrors.length > 0 && (
            <div className="space-y-1">
              <p className="text-red-800 text-sm font-medium">Erros de validação:</p>
              <ul className="list-disc list-inside space-y-1">
                {fieldErrors.map((fieldError, index) => (
                  <li key={`field-error-${index}`} className="text-red-700 text-sm">
                    <span className="font-medium">{fieldError.path}:</span> {fieldError.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuickAdGenerator;