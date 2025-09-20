'use client';

import { useState, useCallback } from 'react';
import {
  getAds,
  getAdById,
  createAd,
  updateAd,
  deleteAd,
  updateAdStatus,
  updateAdsStatusBatch,
  searchAds
} from '@/lib/api';

interface Ad {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  bullet_points: string[];
  category_path: string;
  price_strategy: string;
  price_value?: number;
  marketplace: string;
  status: string;
  product_id: number;
  company_id: number;
  external_id?: string;
  created_at: string;
  updated_at: string;
}

interface UseAdsParams {
  page?: number;
  limit?: number;
  status?: string;
  product_id?: number;
  marketplace?: string;
}

interface UseAdsReturn {
  ads: Ad[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  fetchAds: (params?: UseAdsParams) => Promise<void>;
  getAd: (id: number) => Promise<Ad | null>;
  createNewAd: (adData: Partial<Ad>) => Promise<Ad | null>;
  updateExistingAd: (id: number, adData: Partial<Ad>) => Promise<Ad | null>;
  deleteExistingAd: (id: number) => Promise<boolean>;
  updateStatus: (id: number, status: string) => Promise<boolean>;
  updateStatusBatch: (adIds: number[], status: string) => Promise<boolean>;
  searchAdsByText: (query: string) => Promise<Ad[]>;
  refreshAds: () => Promise<void>;
}

export const useAds = (initialParams?: UseAdsParams): UseAdsReturn => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastParams, setLastParams] = useState<UseAdsParams | undefined>(initialParams);

  const fetchAds = useCallback(async (params?: UseAdsParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const finalParams = { ...initialParams, ...params };
      setLastParams(finalParams);
      
      const response = await getAds(finalParams);
      
      setAds(response.items || response.data || response);
      setTotalPages(response.total_pages || Math.ceil((response.total || response.length) / (finalParams.limit || 10)));
      setCurrentPage(finalParams.page || 1);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erro ao carregar anúncios');
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [initialParams]);

  const getAd = useCallback(async (id: number): Promise<Ad | null> => {
    try {
      const response = await getAdById(id);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erro ao carregar anúncio');
      return null;
    }
  }, []);

  const createNewAd = useCallback(async (adData: Partial<Ad>): Promise<Ad | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await createAd(adData);
      
      // Atualizar lista local
      setAds(prev => [response, ...prev]);
      
      return response;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erro ao criar anúncio');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExistingAd = useCallback(async (id: number, adData: Partial<Ad>): Promise<Ad | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await updateAd(id, adData);
      
      // Atualizar lista local
      setAds(prev => prev.map(ad => ad.id === id ? { ...ad, ...response } : ad));
      
      return response;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erro ao atualizar anúncio');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteExistingAd = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteAd(id);
      
      // Remover da lista local
      setAds(prev => prev.filter(ad => ad.id !== id));
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erro ao excluir anúncio');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id: number, status: string): Promise<boolean> => {
    try {
      await updateAdStatus(id, status);
      
      // Atualizar lista local
      setAds(prev => prev.map(ad => ad.id === id ? { ...ad, status } : ad));
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erro ao atualizar status');
      return false;
    }
  }, []);

  const updateStatusBatch = useCallback(async (adIds: number[], status: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await updateAdsStatusBatch(adIds, status);
      
      // Atualizar lista local
      setAds(prev => prev.map(ad => 
        adIds.includes(ad.id) ? { ...ad, status } : ad
      ));
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erro ao atualizar status em lote');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchAdsByText = useCallback(async (query: string): Promise<Ad[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await searchAds(query);
      return response.items || response.data || response;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erro ao buscar anúncios');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAds = useCallback(async () => {
    if (lastParams) {
      await fetchAds(lastParams);
    } else {
      await fetchAds();
    }
  }, [fetchAds, lastParams]);

  return {
    ads,
    loading,
    error,
    totalPages,
    currentPage,
    fetchAds,
    getAd,
    createNewAd,
    updateExistingAd,
    deleteExistingAd,
    updateStatus,
    updateStatusBatch,
    searchAdsByText,
    refreshAds
  };
};

export default useAds;