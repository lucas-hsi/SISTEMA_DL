// Hook para Gestão de Sucatas - DL Auto Peças

import { useState, useEffect, useCallback } from 'react';
import { 
  scrapsService,
  scrapPartsService,
  suppliersService
} from '../services/firestoreService';
import { 
  Scrap, 
  ScrapPart, 
  Supplier, 
  ScrapSearchFilters, 
  PartSearchFilters,
  ScrapFormData,
  PartFormData,
  QRCodeData
} from '../types/scrap';
import { useAuth } from './useAuth';
import { useNotification } from './useNotification';

// ===== HOOK PRINCIPAL DE SUCATAS =====
export const useScrapManagement = () => {
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true
  });
  
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Buscar sucatas com filtros
  const fetchScraps = useCallback(async (filters?: ScrapSearchFilters, page = 1) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const queryFilters: any[] = [];
      
      // Aplicar filtros
      if (filters?.supplierId) {
        queryFilters.push({ field: 'supplierId', operator: '==', value: filters.supplierId });
      }
      
      if (filters?.vehicleBrand) {
        queryFilters.push({ field: 'vehicleInfo.brand', operator: '==', value: filters.vehicleBrand });
      }
      
      if (filters?.status) {
        queryFilters.push({ field: 'status', operator: '==', value: filters.status });
      }
      
      if (filters?.dateRange) {
        queryFilters.push(
          { field: 'createdAt', operator: '>=', value: filters.dateRange.start },
          { field: 'createdAt', operator: '<=', value: filters.dateRange.end }
        );
      }
      
      const scrapsData = await scrapsService.readMany({
        queryFilters,
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit: pagination.limit
      });
      
      const scrapData = scrapsData.map(scrap => ({
        ...scrap,
        createdAt: scrap.createdAt?.toDate ? scrap.createdAt.toDate() : scrap.createdAt,
        updatedAt: scrap.updatedAt?.toDate ? scrap.updatedAt.toDate() : scrap.updatedAt,
        purchaseInfo: scrap.purchaseInfo ? {
          ...scrap.purchaseInfo,
          purchaseDate: scrap.purchaseInfo.purchaseDate?.toDate ? scrap.purchaseInfo.purchaseDate.toDate() : scrap.purchaseInfo.purchaseDate
        } : undefined,
        dismantlingInfo: scrap.dismantlingInfo ? {
          ...scrap.dismantlingInfo,
          startDate: scrap.dismantlingInfo.startDate?.toDate ? scrap.dismantlingInfo.startDate.toDate() : scrap.dismantlingInfo.startDate,
          endDate: scrap.dismantlingInfo.endDate?.toDate ? scrap.dismantlingInfo.endDate.toDate() : scrap.dismantlingInfo.endDate
        } : undefined
      })) as Scrap[];
      
      if (page === 1) {
        setScraps(scrapData);
      } else {
        setScraps(prev => [...prev, ...scrapData]);
      }
      
      setPagination(prev => ({
        ...prev,
        page,
        hasMore: scrapData.length === pagination.limit
      }));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar sucatas';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, pagination.limit, showNotification]);

  // Criar nova sucata
  const createScrap = useCallback(async (data: ScrapFormData): Promise<string | null> => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const scrapData = {
        ...data,
        code: `SCR-${Date.now()}`,
        status: 'purchased',
        parts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.uid
      };
      
      const result = await scrapsService.create(scrapData);
      
      showNotification('Sucata cadastrada com sucesso!', 'success');
      await fetchScraps(); // Recarregar lista
      
      return result.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar sucata';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, showNotification, fetchScraps]);

  // Atualizar sucata
  const updateScrap = useCallback(async (id: string, data: Partial<Scrap>): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    try {
      await scrapsService.update(id, {
        ...data,
        updatedAt: new Date(),
        updatedBy: user.uid
      });
      
      showNotification('Sucata atualizada com sucesso!', 'success');
      await fetchScraps(); // Recarregar lista
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar sucata';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, showNotification, fetchScraps]);

  // Deletar sucata
  const deleteScrap = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    try {
      await scrapsService.delete(id);
      
      showNotification('Sucata removida com sucesso!', 'success');
      setScraps(prev => prev.filter(scrap => scrap.id !== id));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover sucata';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // Buscar sucata por ID
  const getScrapById = useCallback(async (id: string): Promise<Scrap | null> => {
    if (!user) return null;
    
    try {
      const scrap = await scrapsService.readOne(id);
      return scrap;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar sucata';
      setError(errorMessage);
      return null;
    }
  }, [user]);

  return {
    scraps,
    loading,
    error,
    pagination,
    fetchScraps,
    createScrap,
    updateScrap,
    deleteScrap,
    getScrapById
  };
};

// ===== HOOK PARA PEÇAS DE SUCATA =====
export const useScrapParts = (scrapId?: string) => {
  const [parts, setParts] = useState<ScrapPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Buscar peças
  const fetchParts = useCallback(async (filters?: PartSearchFilters) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const queryFilters: any[] = [];
      
      // Filtrar por sucata específica
      if (scrapId) {
        queryFilters.push({ field: 'scrapId', operator: '==', value: scrapId });
      }
      
      // Aplicar outros filtros
      if (filters?.category) {
        queryFilters.push({ field: 'category', operator: '==', value: filters.category });
      }
      
      if (filters?.condition) {
        queryFilters.push({ field: 'condition', operator: '==', value: filters.condition });
      }
      
      if (filters?.status) {
        queryFilters.push({ field: 'status', operator: '==', value: filters.status });
      }
      
      const partsData = await scrapPartsService.readMany({
        queryFilters,
        orderBy: [{ field: 'createdAt', direction: 'desc' }]
      });
      
      setParts(partsData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar peças';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, scrapId, showNotification]);

  // Criar nova peça
  const createPart = useCallback(async (data: PartFormData): Promise<string | null> => {
    if (!user || !scrapId) return null;
    
    setLoading(true);
    try {
      const sku = `${scrapId}-${Date.now()}`;
      
      const partData = {
        ...data,
        sku,
        scrapId,
        status: 'available',
        inventory: {
          quantity: data.quantity,
          reserved: 0,
          available: data.quantity,
          minimumStock: 1,
          reorderPoint: 1,
          movements: []
        },
        pricing: {
          costPrice: 0, // Será calculado baseado no custo da sucata
          sellingPrice: data.sellingPrice,
          minimumPrice: data.minimumPrice,
          profitMargin: 0,
          discountAllowed: 10,
          priceHistory: []
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.uid
      };
      
      // Gerar QR Code se solicitado
      if (data.generateQRCode) {
        const qrCodeData: QRCodeData = {
          sku,
          partName: data.name,
          scrapCode: scrapId,
          vehicleBrand: '',
          vehicleModel: '',
          vehicleYear: new Date().getFullYear(),
          condition: data.condition,
          price: data.sellingPrice,
          location: `${data.location.warehouse}-${data.location.section}`,
          contactInfo: 'DL Auto Peças - (11) 99999-9999'
        };
        
        partData.qrCode = {
          code: sku,
          generatedAt: new Date(),
          scannedCount: 0,
          data: qrCodeData
        };
      }
      
      const result = await scrapPartsService.create(partData);
      
      showNotification('Peça cadastrada com sucesso!', 'success');
      await fetchParts(); // Recarregar lista
      
      return result.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar peça';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, scrapId, showNotification, fetchParts]);

  // Atualizar peça
  const updatePart = useCallback(async (id: string, data: Partial<ScrapPart>): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    try {
      await scrapPartsService.update(id, {
        ...data,
        updatedAt: new Date(),
        updatedBy: user.uid
      });
      
      showNotification('Peça atualizada com sucesso!', 'success');
      await fetchParts(); // Recarregar lista
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar peça';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, showNotification, fetchParts]);

  // Deletar peça
  const deletePart = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    try {
      await scrapPartsService.delete(id);
      
      showNotification('Peça removida com sucesso!', 'success');
      setParts(prev => prev.filter(part => part.id !== id));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover peça';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // Gerar QR Code para peça existente
  const generateQRCode = useCallback(async (partId: string, partData: ScrapPart): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const qrCodeData: QRCodeData = {
        sku: partData.sku,
        partName: partData.name,
        scrapCode: partData.scrapId,
        vehicleBrand: partData.compatibility[0]?.brand || '',
        vehicleModel: partData.compatibility[0]?.model || '',
        vehicleYear: partData.compatibility[0]?.yearStart || new Date().getFullYear(),
        condition: partData.condition,
        price: partData.pricing.sellingPrice,
        location: `${partData.location.warehouse}-${partData.location.section}`,
        contactInfo: 'DL Auto Peças - (11) 99999-9999'
      };
      
      const qrCode = {
        code: partData.sku,
        generatedAt: new Date(),
        scannedCount: 0,
        data: qrCodeData
      };
      
      await scrapPartsService.update(partId, {
        qrCode,
        updatedAt: new Date(),
        updatedBy: user.uid
      });
      
      showNotification('QR Code gerado com sucesso!', 'success');
      await fetchParts();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar QR Code';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return false;
    }
  }, [user, showNotification, fetchParts]);

  return {
    parts,
    loading,
    error,
    fetchParts,
    createPart,
    updatePart,
    deletePart,
    generateQRCode
  };
};

// ===== HOOK PARA FORNECEDORES =====
export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Buscar fornecedores
  const fetchSuppliers = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const suppliersData = await suppliersService.readMany({
        orderBy: [{ field: 'name', direction: 'asc' }]
      });
      
      setSuppliers(suppliersData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar fornecedores';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  // Criar fornecedor
  const createSupplier = useCallback(async (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string | null> => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const supplierData = {
        ...data,
        totalPurchases: 0,
        averagePrice: 0,
        rating: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.uid
      };
      
      const result = await suppliersService.create(supplierData);
      
      showNotification('Fornecedor cadastrado com sucesso!', 'success');
      await fetchSuppliers();
      
      return result.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar fornecedor';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, showNotification, fetchSuppliers]);

  return {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    createSupplier
  };
};