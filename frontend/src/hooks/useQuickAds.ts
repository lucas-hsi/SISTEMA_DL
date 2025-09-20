'use client';

import { useState, useCallback } from 'react';
import api, { parseApiError, ApiError } from '@/lib/api';

export interface QuickGenerateRequest {
  part_number: string;
  images: string[] | File[];
  marketplace: 'mercado_livre' | 'shopee' | 'amazon' | 'magalu';
  process_background?: boolean;
  custom_prompt?: string;
}

// Mapeamento de rótulos UI para valores canônicos
const MARKETPLACE_MAPPING: Record<string, string> = {
  'Mercado Livre': 'mercado_livre',
  'Amazon': 'amazon',
  'Shopee': 'shopee',
  'Magazine Luiza': 'magalu',
  'Magalu': 'magalu'
};

// Função para detectar se há arquivos nas imagens
const hasFiles = (images: string[] | File[]): images is File[] => {
  return images.some((img: any) => img instanceof File || img instanceof Blob);
};

// Função para mapear marketplace
const mapMarketplace = (marketplace: string): string => {
  return MARKETPLACE_MAPPING[marketplace] || marketplace;
};

export interface QuickGenerateResponse {
  success: boolean;
  ad_id?: number;
  product_id?: number;
  sku_generated?: string;
  qr_code_path?: string;
  title?: string;
  description?: string;
  processed_images?: string[];
  validation_flags?: Record<string, any>;
  message: string;
  processing_time?: number;
}

export interface CreateZipRequest {
  ad_ids: number[];
  include_images?: boolean;
  include_qr_codes?: boolean;
  zip_format?: 'csv' | 'json' | 'xlsx';
}

export interface CreateZipResponse {
  success: boolean;
  download_url?: string;
  file_size?: number;
  ads_count?: number;
  message: string;
}

export interface PublishRequest {
  ad_ids: number[];
  marketplace: 'mercado_livre' | 'shopee' | 'amazon' | 'magalu';
  schedule_time?: string;
}

export interface PublishResponse {
  success: boolean;
  pending_jobs?: Array<{
    job_id: string;
    ad_id: number;
    marketplace: string;
    status: string;
    created_at: string;
    scheduled_for?: string;
  }>;
  message: string;
}

export interface UseQuickAdsReturn {
  // Estados
  loading: boolean;
  error: string | null;
  fieldErrors: Array<{ path: string; message: string }> | null;
  
  // Geração rápida
  quickGenerate: (request: QuickGenerateRequest) => Promise<QuickGenerateResponse | null>;
  
  // Criação de ZIP
  createZip: (request: CreateZipRequest) => Promise<CreateZipResponse | null>;
  
  // Publicação
  publishAds: (request: PublishRequest) => Promise<PublishResponse | null>;
  
  // Download de ZIP
  downloadZip: (filename: string) => Promise<void>;
  
  // Limpar estados
  clearError: () => void;
}

export const useQuickAds = (): UseQuickAdsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Array<{ path: string; message: string }> | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setFieldErrors(null);
  }, []);

  const handleError = useCallback((err: any) => {
    const parsedError = parseApiError(err);
    // Exibir response.data.detail diretamente conforme especificação
    setError(parsedError.message);
    setFieldErrors(parsedError.fieldErrors || null);
  }, []);

  const quickGenerate = useCallback(async (request: QuickGenerateRequest): Promise<QuickGenerateResponse | null> => {
    setLoading(true);
    clearError();
    
    try {
      // Mapear marketplace para valor canônico
      const canonicalMarketplace = mapMarketplace(request.marketplace);
      
      // Verificar se há arquivos nas imagens
      if (hasFiles(request.images)) {
        // Envio multipart/form-data
        const formData = new FormData();
        formData.append('part_number', request.part_number);
        formData.append('marketplace', canonicalMarketplace);
        formData.append('process_background', String(request.process_background ?? true));
        
        if (request.custom_prompt) {
          formData.append('custom_prompt', request.custom_prompt);
        }
        
        // Adicionar arquivos
        request.images.forEach((file) => {
          formData.append('files', file);
        });
        
        const response = await api.post('/quick-ads/quick-generate', formData, {
          headers: {
            // Não definir Content-Type manualmente - deixar o browser definir com boundary
          }
        });
        return response.data;
      } else {
        // Envio JSON
        const jsonRequest = {
          ...request,
          marketplace: canonicalMarketplace,
          images: request.images as string[]
        };
        
        // Validar que há pelo menos uma imagem
        if (!jsonRequest.images || jsonRequest.images.length === 0) {
          throw new Error('É necessário fornecer pelo menos uma imagem');
        }
        
        const response = await api.post('/quick-ads/quick-generate', jsonRequest);
        return response.data;
      }
    } catch (err: any) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  const createZip = useCallback(async (request: CreateZipRequest): Promise<CreateZipResponse | null> => {
    setLoading(true);
    clearError();
    
    try {
      const response = await api.post('/quick-ads/quick-create-zip', request);
      return response.data;
    } catch (err: any) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  const publishAds = useCallback(async (request: PublishRequest): Promise<PublishResponse | null> => {
    setLoading(true);
    clearError();
    
    try {
      const response = await api.post('/quick-ads/publish', request);
      return response.data;
    } catch (err: any) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  const downloadZip = useCallback(async (filename: string): Promise<void> => {
    try {
      const response = await api.get(`/quick-ads/download-zip/${filename}`, {
        responseType: 'blob'
      });
      
      // Criar URL do blob e fazer download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      handleError(err);
    }
  }, [handleError]);

  return {
    loading,
    error,
    fieldErrors,
    quickGenerate,
    createZip,
    publishAds,
    downloadZip,
    clearError
  };
};

export default useQuickAds;