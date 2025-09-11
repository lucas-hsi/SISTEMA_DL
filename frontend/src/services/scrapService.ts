// Serviço de Sucatas - DL Auto Peças

import { DocumentSnapshot } from 'firebase/firestore';
import { scrapsService, scrapPartsService, suppliersService } from './firestoreService';
import { Scrap, ScrapPart, Supplier } from '../types';

// ===== SERVIÇOS DE SUCATAS =====
export class ScrapService {
  // Buscar todas as sucatas
  static async getAllScraps(filters?: {
    supplierId?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    lastDoc?: DocumentSnapshot;
  }): Promise<{ scraps: Scrap[]; lastDoc?: DocumentSnapshot }> {
    try {
      const queryFilters = [];
      
      // Aplicar filtros
      if (filters?.supplierId) {
        queryFilters.push({ field: 'supplierId', operator: '==', value: filters.supplierId });
      }
      
      if (filters?.status) {
        queryFilters.push({ field: 'status', operator: '==', value: filters.status });
      }
      
      if (filters?.dateFrom) {
        queryFilters.push({ field: 'purchaseDate', operator: '>=', value: filters.dateFrom });
      }
      
      if (filters?.dateTo) {
        queryFilters.push({ field: 'purchaseDate', operator: '<=', value: filters.dateTo });
      }
      
      const scraps = await scrapsService.readMany({
        queryFilters,
        orderBy: [{ field: 'purchaseDate', direction: 'desc' }],
        limit: filters?.limit
      });
      
      // Mapear datas
      const mappedScraps = scraps.map(scrap => ({
        ...scrap,
        purchaseDate: scrap.purchaseDate?.toDate?.() || scrap.purchaseDate,
        createdAt: scrap.createdAt?.toDate?.() || scrap.createdAt,
        updatedAt: scrap.updatedAt?.toDate?.() || scrap.updatedAt
      })) as Scrap[];
      
      return { scraps: mappedScraps };
    } catch (error) {
      console.error('Erro ao buscar sucatas:', error);
      throw new Error('Falha ao carregar sucatas');
    }
  }
  
  // Buscar sucata por ID
  static async getScrapById(id: string): Promise<Scrap | null> {
    try {
      const scrap = await scrapsService.readById(id);
      
      if (scrap) {
        return {
          ...scrap,
          purchaseDate: scrap.purchaseDate?.toDate?.() || scrap.purchaseDate,
          createdAt: scrap.createdAt?.toDate?.() || scrap.createdAt,
          updatedAt: scrap.updatedAt?.toDate?.() || scrap.updatedAt
        } as Scrap;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar sucata:', error);
      throw new Error('Falha ao carregar sucata');
    }
  }
  
  // Criar nova sucata
  static async createScrap(scrapData: Omit<Scrap, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      return await scrapsService.create(scrapData);
    } catch (error) {
      console.error('Erro ao criar sucata:', error);
      throw new Error('Falha ao criar sucata');
    }
  }
  
  // Atualizar sucata
  static async updateScrap(id: string, updates: Partial<Omit<Scrap, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await scrapsService.update(id, updates);
    } catch (error) {
      console.error('Erro ao atualizar sucata:', error);
      throw new Error('Falha ao atualizar sucata');
    }
  }
  
  // Deletar sucata
  static async deleteScrap(id: string): Promise<void> {
    try {
      // Primeiro, deletar todas as peças relacionadas
      const parts = await scrapPartsService.readMany({
        queryFilters: [{ field: 'scrapId', operator: '==', value: id }]
      });
      
      const deletePromises = parts.map(part => scrapPartsService.delete(part.id));
      await Promise.all(deletePromises);
      
      // Depois, deletar a sucata
      await scrapsService.delete(id);
    } catch (error) {
      console.error('Erro ao deletar sucata:', error);
      throw new Error('Falha ao deletar sucata');
    }
  }
}

// ===== SERVIÇOS DE PEÇAS DE SUCATA =====
export class ScrapPartService {
  // Buscar peças por sucata
  static async getPartsByScrapId(scrapId: string): Promise<ScrapPart[]> {
    try {
      const parts = await scrapPartsService.readMany({
        queryFilters: [{ field: 'scrapId', operator: '==', value: scrapId }],
        orderBy: [{ field: 'createdAt', direction: 'desc' }]
      });
      
      return parts.map(part => ({
        ...part,
        createdAt: part.createdAt?.toDate?.() || part.createdAt,
        updatedAt: part.updatedAt?.toDate?.() || part.updatedAt
      })) as ScrapPart[];
    } catch (error) {
      console.error('Erro ao buscar peças da sucata:', error);
      throw new Error('Falha ao carregar peças da sucata');
    }
  }
  
  // Buscar todas as peças
  static async getAllParts(filters?: {
    scrapId?: string;
    status?: string;
    limit?: number;
  }): Promise<ScrapPart[]> {
    try {
      const queryFilters = [];
      
      if (filters?.scrapId) {
        queryFilters.push({ field: 'scrapId', operator: '==', value: filters.scrapId });
      }
      
      if (filters?.status) {
        queryFilters.push({ field: 'status', operator: '==', value: filters.status });
      }
      
      const parts = await scrapPartsService.readMany({
        queryFilters,
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit: filters?.limit
      });
      
      return parts.map(part => ({
        ...part,
        createdAt: part.createdAt?.toDate?.() || part.createdAt,
        updatedAt: part.updatedAt?.toDate?.() || part.updatedAt
      })) as ScrapPart[];
    } catch (error) {
      console.error('Erro ao buscar peças:', error);
      throw new Error('Falha ao carregar peças');
    }
  }
  
  // Criar nova peça
  static async createPart(partData: Omit<ScrapPart, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      return await scrapPartsService.create(partData);
    } catch (error) {
      console.error('Erro ao criar peça:', error);
      throw new Error('Falha ao criar peça');
    }
  }
  
  // Atualizar peça
  static async updatePart(id: string, updates: Partial<Omit<ScrapPart, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await scrapPartsService.update(id, updates);
    } catch (error) {
      console.error('Erro ao atualizar peça:', error);
      throw new Error('Falha ao atualizar peça');
    }
  }
  
  // Deletar peça
  static async deletePart(id: string): Promise<void> {
    try {
      await scrapPartsService.delete(id);
    } catch (error) {
      console.error('Erro ao deletar peça:', error);
      throw new Error('Falha ao deletar peça');
    }
  }
}

// ===== SERVIÇOS DE FORNECEDORES =====
export class SupplierService {
  // Buscar todos os fornecedores
  static async getAllSuppliers(): Promise<Supplier[]> {
    try {
      const suppliers = await suppliersService.readMany({
        orderBy: [{ field: 'name', direction: 'asc' }]
      });
      
      return suppliers.map(supplier => ({
        ...supplier,
        createdAt: supplier.createdAt?.toDate?.() || supplier.createdAt,
        updatedAt: supplier.updatedAt?.toDate?.() || supplier.updatedAt
      })) as Supplier[];
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      throw new Error('Falha ao carregar fornecedores');
    }
  }
  
  // Buscar fornecedor por ID
  static async getSupplierById(id: string): Promise<Supplier | null> {
    try {
      const supplier = await suppliersService.readById(id);
      
      if (supplier) {
        return {
          ...supplier,
          createdAt: supplier.createdAt?.toDate?.() || supplier.createdAt,
          updatedAt: supplier.updatedAt?.toDate?.() || supplier.updatedAt
        } as Supplier;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar fornecedor:', error);
      throw new Error('Falha ao carregar fornecedor');
    }
  }
  
  // Criar novo fornecedor
  static async createSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      return await suppliersService.create(supplierData);
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      throw new Error('Falha ao criar fornecedor');
    }
  }
  
  // Atualizar fornecedor
  static async updateSupplier(id: string, updates: Partial<Omit<Supplier, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await suppliersService.update(id, updates);
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      throw new Error('Falha ao atualizar fornecedor');
    }
  }
  
  // Deletar fornecedor
  static async deleteSupplier(id: string): Promise<void> {
    try {
      await suppliersService.delete(id);
    } catch (error) {
      console.error('Erro ao deletar fornecedor:', error);
      throw new Error('Falha ao deletar fornecedor');
    }
  }
}