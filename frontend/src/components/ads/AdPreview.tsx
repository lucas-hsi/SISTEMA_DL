'use client';

import { useState } from 'react';
import { FiEye, FiSmartphone, FiMonitor, FiTablet } from 'react-icons/fi';
import { AdFormData } from './AdForm';

interface AdPreviewProps {
  adData: Partial<AdFormData> & {
    marketplace?: string;
  };
  productData?: {
    name: string;
    images?: string[];
    brand?: string;
    model?: string;
  };
  className?: string;
}

type ViewportSize = 'mobile' | 'tablet' | 'desktop';

const AdPreview = ({ adData, productData, className = '' }: AdPreviewProps) => {
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');

  const getMarketplacePreview = () => {
    const marketplace = adData.marketplace?.toLowerCase() || 'mercadolivre';
    
    switch (marketplace) {
      case 'mercadolivre':
      case 'mercado_livre':
        return renderMercadoLivrePreview();
      case 'shopee':
        return renderShopeePreview();
      case 'amazon':
        return renderAmazonPreview();
      case 'magalu':
        return renderMagaluPreview();
      default:
        return renderGenericPreview();
    }
  };

  const renderMercadoLivrePreview = () => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header do ML */}
      <div className="bg-yellow-400 p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">ML</span>
          </div>
          <span className="font-semibold text-blue-900">Mercado Livre</span>
        </div>
      </div>
      
      {/* Conteúdo */}
      <div className="p-4">
        {/* Título */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {adData.title || 'Título do anúncio'}
        </h2>
        
        {/* Subtítulo */}
        {adData.subtitle && (
          <p className="text-gray-600 mb-3 italic">{adData.subtitle}</p>
        )}
        
        {/* Preço */}
        <div className="mb-4">
          {adData.price_value ? (
            <div className="text-2xl font-bold text-green-600">
              R$ {adData.price_value.toFixed(2).replace('.', ',')}
            </div>
          ) : (
            <div className="text-lg text-gray-500">
              Preço: {adData.price_strategy || 'A definir'}
            </div>
          )}
        </div>
        
        {/* Descrição */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Descrição</h3>
          <p className="text-gray-700 whitespace-pre-line">
            {adData.description || 'Descrição do produto...'}
          </p>
        </div>
        
        {/* Características */}
        {adData.bullet_points && adData.bullet_points.filter(p => p.trim()).length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Características</h3>
            <ul className="space-y-1">
              {adData.bullet_points.filter(p => p.trim()).map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Categoria */}
        {adData.category_path && (
          <div className="text-sm text-gray-500 border-t pt-3">
            <strong>Categoria:</strong> {adData.category_path}
          </div>
        )}
      </div>
    </div>
  );

  const renderShopeePreview = () => (
    <div className="bg-white border border-orange-200 rounded-lg overflow-hidden">
      {/* Header da Shopee */}
      <div className="bg-orange-500 p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-orange-500 font-bold text-sm">S</span>
          </div>
          <span className="font-semibold text-white">Shopee</span>
        </div>
      </div>
      
      {/* Conteúdo */}
      <div className="p-4">
        {/* Título com emojis */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          🔥 {adData.title || 'Título do anúncio'} 🔥
        </h2>
        
        {/* Subtítulo */}
        {adData.subtitle && (
          <p className="text-gray-600 mb-3">✨ {adData.subtitle} ✨</p>
        )}
        
        {/* Preço */}
        <div className="mb-4">
          {adData.price_value ? (
            <div className="text-2xl font-bold text-orange-600">
              💰 R$ {adData.price_value.toFixed(2).replace('.', ',')}
            </div>
          ) : (
            <div className="text-lg text-gray-500">
              💵 {adData.price_strategy || 'Preço a definir'}
            </div>
          )}
        </div>
        
        {/* Descrição */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">📝 Descrição</h3>
          <p className="text-gray-700 whitespace-pre-line">
            {adData.description || 'Descrição do produto...'}
          </p>
        </div>
        
        {/* Características */}
        {adData.bullet_points && adData.bullet_points.filter(p => p.trim()).length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">🎯 Destaques</h3>
            <ul className="space-y-1">
              {adData.bullet_points.filter(p => p.trim()).map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">✅</span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Categoria */}
        {adData.category_path && (
          <div className="text-sm text-gray-500 border-t pt-3">
            📂 <strong>Categoria:</strong> {adData.category_path}
          </div>
        )}
      </div>
    </div>
  );

  const renderAmazonPreview = () => (
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
      {/* Header da Amazon */}
      <div className="bg-gray-900 p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-400 rounded flex items-center justify-center">
            <span className="text-black font-bold text-sm">a</span>
          </div>
          <span className="font-semibold text-white">Amazon</span>
        </div>
      </div>
      
      {/* Conteúdo */}
      <div className="p-4">
        {/* Título */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {adData.title || 'Product Title'}
        </h2>
        
        {/* Subtítulo */}
        {adData.subtitle && (
          <p className="text-gray-600 mb-3">{adData.subtitle}</p>
        )}
        
        {/* Preço */}
        <div className="mb-4">
          {adData.price_value ? (
            <div className="text-2xl font-bold text-red-600">
              ${adData.price_value.toFixed(2)}
            </div>
          ) : (
            <div className="text-lg text-gray-500">
              Price: {adData.price_strategy || 'TBD'}
            </div>
          )}
        </div>
        
        {/* Características como bullet points */}
        {adData.bullet_points && adData.bullet_points.filter(p => p.trim()).length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Feature Highlights</h3>
            <ul className="space-y-1 list-disc list-inside">
              {adData.bullet_points.filter(p => p.trim()).slice(0, 5).map((point, index) => (
                <li key={index} className="text-gray-700">{point}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Descrição */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Product Description</h3>
          <p className="text-gray-700 whitespace-pre-line">
            {adData.description || 'Product description...'}
          </p>
        </div>
        
        {/* Categoria */}
        {adData.category_path && (
          <div className="text-sm text-gray-500 border-t pt-3">
            <strong>Category:</strong> {adData.category_path}
          </div>
        )}
      </div>
    </div>
  );

  const renderMagaluPreview = () => (
    <div className="bg-white border border-blue-200 rounded-lg overflow-hidden">
      {/* Header do Magalu */}
      <div className="bg-blue-600 p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">M</span>
          </div>
          <span className="font-semibold text-white">Magazine Luiza</span>
        </div>
      </div>
      
      {/* Conteúdo similar ao ML */}
      <div className="p-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {adData.title || 'Título do produto'}
        </h2>
        
        {adData.subtitle && (
          <p className="text-gray-600 mb-3">{adData.subtitle}</p>
        )}
        
        <div className="mb-4">
          {adData.price_value ? (
            <div className="text-2xl font-bold text-blue-600">
              R$ {adData.price_value.toFixed(2).replace('.', ',')}
            </div>
          ) : (
            <div className="text-lg text-gray-500">
              {adData.price_strategy || 'Preço a consultar'}
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <p className="text-gray-700 whitespace-pre-line">
            {adData.description || 'Descrição do produto...'}
          </p>
        </div>
        
        {adData.bullet_points && adData.bullet_points.filter(p => p.trim()).length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Características</h3>
            <ul className="space-y-1">
              {adData.bullet_points.filter(p => p.trim()).map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {adData.category_path && (
          <div className="text-sm text-gray-500 border-t pt-3">
            <strong>Categoria:</strong> {adData.category_path}
          </div>
        )}
      </div>
    </div>
  );

  const renderGenericPreview = () => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {adData.title || 'Título do anúncio'}
        </h2>
        
        {adData.subtitle && (
          <p className="text-gray-600 mb-3">{adData.subtitle}</p>
        )}
        
        <div className="mb-4">
          {adData.price_value ? (
            <div className="text-2xl font-bold text-green-600">
              R$ {adData.price_value.toFixed(2).replace('.', ',')}
            </div>
          ) : (
            <div className="text-lg text-gray-500">
              {adData.price_strategy || 'Preço a definir'}
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <p className="text-gray-700 whitespace-pre-line">
            {adData.description || 'Descrição do produto...'}
          </p>
        </div>
        
        {adData.bullet_points && adData.bullet_points.filter(p => p.trim()).length > 0 && (
          <div className="mb-4">
            <ul className="space-y-1">
              {adData.bullet_points.filter(p => p.trim()).map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-gray-500 mt-1">•</span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {adData.category_path && (
          <div className="text-sm text-gray-500 border-t pt-3">
            <strong>Categoria:</strong> {adData.category_path}
          </div>
        )}
      </div>
    </div>
  );

  const getViewportClasses = () => {
    switch (viewportSize) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-md mx-auto';
      case 'desktop':
      default:
        return 'max-w-2xl mx-auto';
    }
  };

  return (
    <div className={`${className}`}>
      {/* Controles de Viewport */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiEye className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Preview do Anúncio</span>
          {adData.marketplace && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {adData.marketplace}
            </span>
          )}
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => setViewportSize('mobile')}
            className={`p-2 rounded ${
              viewportSize === 'mobile' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Visualização Mobile"
          >
            <FiSmartphone size={16} />
          </button>
          <button
            onClick={() => setViewportSize('tablet')}
            className={`p-2 rounded ${
              viewportSize === 'tablet' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Visualização Tablet"
          >
            <FiTablet size={16} />
          </button>
          <button
            onClick={() => setViewportSize('desktop')}
            className={`p-2 rounded ${
              viewportSize === 'desktop' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Visualização Desktop"
          >
            <FiMonitor size={16} />
          </button>
        </div>
      </div>
      
      {/* Preview Container */}
      <div className={`transition-all duration-300 ${getViewportClasses()}`}>
        {getMarketplacePreview()}
      </div>
      
      {/* Informações adicionais */}
      {productData && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <strong>Produto:</strong> {productData.name}
          {productData.brand && <span> • <strong>Marca:</strong> {productData.brand}</span>}
          {productData.model && <span> • <strong>Modelo:</strong> {productData.model}</span>}
        </div>
      )}
    </div>
  );
};

export default AdPreview;
export type { AdPreviewProps };