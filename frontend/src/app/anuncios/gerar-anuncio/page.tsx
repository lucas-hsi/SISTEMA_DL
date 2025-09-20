'use client';

import { useRouter } from 'next/navigation';
import QuickAdGenerator from '@/components/ads/QuickAdGenerator';
import { useAuth } from '@/context/AuthContext';
import { QuickGenerateResponse } from '@/hooks/useQuickAds';

const GerarAnuncioPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  const handleAdGenerated = (response: QuickGenerateResponse) => {
    console.log('Anúncio gerado:', response);
    // Aqui podemos adicionar lógica adicional se necessário
  };

  const handleBackToDashboard = () => {
    router.push('/anuncios/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gerar Anúncio</h1>
              <p className="mt-1 text-sm text-gray-500">
                Geração rápida com IA: Part Number + até 6 fotos
              </p>
            </div>
            <button
              onClick={handleBackToDashboard}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <QuickAdGenerator
              onAdGenerated={handleAdGenerated}
              className="w-full"
            />
          </div>

          {/* Sidebar with Tips */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Como funciona
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">1. Part Number</h4>
                  <p className="text-sm text-gray-600">
                    Informe o código da peça para buscar no estoque local.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">2. Fotos</h4>
                  <p className="text-sm text-gray-600">
                    Adicione até 6 imagens. O fundo será processado automaticamente.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">3. IA Gera Conteúdo</h4>
                  <p className="text-sm text-gray-600">
                    Título, descrição e dados são gerados automaticamente.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">4. SKU e QR</h4>
                  <p className="text-sm text-gray-600">
                    SKU único e QR Code são gerados para rastreamento.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">5. Download/Publicar</h4>
                  <p className="text-sm text-gray-600">
                    Baixe ZIP com todos os arquivos ou publique diretamente.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">💡 Dica</h4>
                <p className="text-sm text-purple-700">
                  Use fotos de boa qualidade para melhores resultados na geração automática.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GerarAnuncioPage;