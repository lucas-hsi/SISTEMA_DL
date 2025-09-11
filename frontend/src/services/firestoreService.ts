import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch,
  runTransaction,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { cacheService, CacheNamespaces, CacheTTL } from './cacheService';

// Tipos para o serviço
export interface FirestoreDocument {
  id?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: any;
}

export interface QueryOptions {
  filters?: Array<{
    field: string;
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in';
    value: any;
  }>;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  limitCount?: number;
  startAfterDoc?: QueryDocumentSnapshot<DocumentData>;
}

export interface PaginationResult<T> {
  documents: T[];
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
  hasMore: boolean;
  total?: number;
}

/**
 * Classe principal para operações CRUD no Firestore
 * Fornece métodos para Create, Read, Update, Delete com suporte a:
 * - Filtros avançados
 * - Paginação
 * - Transações
 * - Listeners em tempo real
 * - Operações em lote
 */
export class FirestoreService {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * CREATE - Criar um novo documento e invalidar cache
   * @param data Dados do documento
   * @param customId ID customizado (opcional)
   * @returns Promise com o ID do documento criado
   */
  async create(data: Omit<FirestoreDocument, 'id' | 'createdAt' | 'updatedAt'>, customId?: string): Promise<string> {
    try {
      const timestamp = serverTimestamp();
      const documentData = {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      let docId: string;
      if (customId) {
        const docRef = doc(db, this.collectionName, customId);
        await updateDoc(docRef, documentData);
        docId = customId;
      } else {
        const docRef = await addDoc(collection(db, this.collectionName), documentData);
        docId = docRef.id;
      }
      
      // Invalidar cache da coleção
      this.invalidateCollectionCache();
      
      return docId;
    } catch (error) {
      console.error(`Erro ao criar documento na coleção ${this.collectionName}:`, error);
      throw new Error(`Falha ao criar documento: ${error}`);
    }
  }

  /**
   * READ - Ler um documento por ID com cache
   * @param id ID do documento
   * @param useCache Usar cache (padrão: true)
   * @returns Promise com os dados do documento ou null se não encontrado
   */
  async readById(id: string, useCache: boolean = true): Promise<FirestoreDocument | null> {
    const cacheKey = `${this.collectionName}:${id}`;
    
    try {
      // Tentar buscar do cache primeiro
      if (useCache) {
        const cached = cacheService.get<FirestoreDocument>(cacheKey, {
          namespace: this.getCacheNamespace()
        });
        
        if (cached) {
          return cached;
        }
      }
      
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = {
          id: docSnap.id,
          ...docSnap.data()
        } as FirestoreDocument;
        
        // Salvar no cache
        if (useCache) {
          cacheService.set(cacheKey, data, {
            namespace: this.getCacheNamespace(),
            ttl: this.getCacheTTL()
          });
        }
        
        return data;
      }
      return null;
    } catch (error) {
      console.error(`Erro ao ler documento ${id} da coleção ${this.collectionName}:`, error);
      throw new Error(`Falha ao ler documento: ${error}`);
    }
  }

  /**
   * READ - Ler múltiplos documentos com filtros, paginação e cache
   * @param options Opções de consulta
   * @returns Promise com array de documentos
   */
  async readMany(options: QueryOptions & { useCache?: boolean } = {}): Promise<FirestoreDocument[]> {
    const { useCache = true, ...queryOptions } = options;
    const cacheKey = this.generateQueryCacheKey(queryOptions);
    
    try {
      // Tentar buscar do cache primeiro
      if (useCache) {
        const cached = cacheService.get<FirestoreDocument[]>(cacheKey, {
          namespace: this.getCacheNamespace()
        });
        
        if (cached) {
          return cached;
        }
      }
      
      const constraints: QueryConstraint[] = [];

      // Aplicar filtros
      if (queryOptions.filters) {
        queryOptions.filters.forEach(filter => {
          constraints.push(where(filter.field, filter.operator, filter.value));
        });
      }

      // Aplicar ordenação
      if (queryOptions.orderByField) {
        constraints.push(orderBy(queryOptions.orderByField, queryOptions.orderDirection || 'asc'));
      }

      // Aplicar paginação
      if (queryOptions.startAfterDoc) {
        constraints.push(startAfter(queryOptions.startAfterDoc));
      }

      // Aplicar limite
      if (queryOptions.limitCount) {
        constraints.push(limit(queryOptions.limitCount));
      }

      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreDocument[];
      
      // Salvar no cache
      if (useCache) {
        cacheService.set(cacheKey, documents, {
          namespace: this.getCacheNamespace(),
          ttl: this.getCacheTTL()
        });
      }
      
      return documents;
    } catch (error) {
      console.error(`Erro ao ler documentos da coleção ${this.collectionName}:`, error);
      throw new Error(`Falha ao ler documentos: ${error}`);
    }
  }

  /**
   * READ - Ler com paginação avançada
   * @param options Opções de consulta
   * @returns Promise com resultado paginado
   */
  async readWithPagination(options: QueryOptions = {}): Promise<PaginationResult<FirestoreDocument>> {
    try {
      const documents = await this.readMany(options);
      const hasMore = options.limitCount ? documents.length === options.limitCount : false;
      const lastDoc = documents.length > 0 ? 
        await getDoc(doc(db, this.collectionName, documents[documents.length - 1].id!)) : undefined;

      return {
        documents,
        lastDoc: lastDoc?.exists() ? lastDoc as QueryDocumentSnapshot<DocumentData> : undefined,
        hasMore
      };
    } catch (error) {
      console.error(`Erro na paginação da coleção ${this.collectionName}:`, error);
      throw new Error(`Falha na paginação: ${error}`);
    }
  }

  /**
   * UPDATE - Atualizar um documento e invalidar cache
   * @param id ID do documento
   * @param data Dados para atualizar
   * @returns Promise void
   */
  async update(id: string, data: Partial<Omit<FirestoreDocument, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
      
      // Invalidar cache do documento e da coleção
      this.invalidateDocumentCache(id);
      this.invalidateCollectionCache();
    } catch (error) {
      console.error(`Erro ao atualizar documento ${id} da coleção ${this.collectionName}:`, error);
      throw new Error(`Falha ao atualizar documento: ${error}`);
    }
  }

  /**
   * DELETE - Excluir um documento e invalidar cache
   * @param id ID do documento
   * @returns Promise void
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      
      // Invalidar cache do documento e da coleção
      this.invalidateDocumentCache(id);
      this.invalidateCollectionCache();
    } catch (error) {
      console.error(`Erro ao excluir documento ${id} da coleção ${this.collectionName}:`, error);
      throw new Error(`Falha ao excluir documento: ${error}`);
    }
  }

  /**
   * BATCH - Operações em lote
   * @param operations Array de operações
   * @returns Promise void
   */
  async batchOperations(operations: Array<{
    type: 'create' | 'update' | 'delete';
    id?: string;
    data?: any;
  }>): Promise<void> {
    try {
      const batch = writeBatch(db);
      const timestamp = serverTimestamp();

      operations.forEach(operation => {
        const docRef = operation.id ? 
          doc(db, this.collectionName, operation.id) : 
          doc(collection(db, this.collectionName));

        switch (operation.type) {
          case 'create':
            batch.set(docRef, {
              ...operation.data,
              createdAt: timestamp,
              updatedAt: timestamp
            });
            break;
          case 'update':
            batch.update(docRef, {
              ...operation.data,
              updatedAt: timestamp
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
    } catch (error) {
      console.error(`Erro nas operações em lote da coleção ${this.collectionName}:`, error);
      throw new Error(`Falha nas operações em lote: ${error}`);
    }
  }

  /**
   * TRANSACTION - Executar transação e invalidar cache
   * @param updateFunction Função de atualização
   * @param affectedCollections Coleções afetadas pela transação
   * @returns Promise com resultado da transação
   */
  async runTransaction<T>(
    updateFunction: (transaction: any) => Promise<T>,
    affectedCollections: string[] = []
  ): Promise<T> {
    try {
      const result = await runTransaction(db, updateFunction);
      
      // Invalidar cache da coleção atual
      this.invalidateCollectionCache();
      
      // Invalidar cache das coleções afetadas
      affectedCollections.forEach(collectionName => {
        this.invalidateCollectionCacheByName(collectionName);
      });
      
      return result;
    } catch (error) {
      console.error(`Erro na transação da coleção ${this.collectionName}:`, error);
      throw new Error(`Falha na transação: ${error}`);
    }
  }

  /**
   * LISTENER - Escutar mudanças em tempo real
   * @param callback Função callback para mudanças
   * @param options Opções de consulta
   * @returns Função para cancelar o listener
   */
  onSnapshot(
    callback: (documents: FirestoreDocument[]) => void,
    options: QueryOptions = {}
  ): Unsubscribe {
    try {
      const constraints: QueryConstraint[] = [];

      if (options.filters) {
        options.filters.forEach(filter => {
          constraints.push(where(filter.field, filter.operator, filter.value));
        });
      }

      if (options.orderByField) {
        constraints.push(orderBy(options.orderByField, options.orderDirection || 'asc'));
      }

      if (options.limitCount) {
        constraints.push(limit(options.limitCount));
      }

      const q = query(collection(db, this.collectionName), ...constraints);
      
      return onSnapshot(q, (querySnapshot) => {
        const documents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FirestoreDocument[];
        
        callback(documents);
      }, (error) => {
        console.error(`Erro no listener da coleção ${this.collectionName}:`, error);
      });
    } catch (error) {
      console.error(`Erro ao criar listener da coleção ${this.collectionName}:`, error);
      throw new Error(`Falha ao criar listener: ${error}`);
    }
  }
  // === MÉTODOS DE CACHE ===

  /**
   * Obter namespace do cache baseado na coleção
   */
  private getCacheNamespace(): string {
    const namespaceMap: Record<string, string> = {
      usuarios: CacheNamespaces.USERS,
      produtos: CacheNamespaces.PRODUCTS,
      pedidos: CacheNamespaces.ORDERS,
      clientes: CacheNamespaces.CUSTOMERS,
      fornecedores: CacheNamespaces.SUPPLIERS,
      categorias: CacheNamespaces.CATEGORIES,
      anuncios: CacheNamespaces.MERCADOLIVRE,
      estoque: CacheNamespaces.PRODUCTS
    };
    
    return namespaceMap[this.collectionName] || CacheNamespaces.SYSTEM;
  }

  /**
   * Obter TTL do cache baseado na coleção
   */
  private getCacheTTL(): number {
    const ttlMap: Record<string, number> = {
      usuarios: CacheTTL.SESSION,
      produtos: CacheTTL.LONG,
      pedidos: CacheTTL.MEDIUM,
      clientes: CacheTTL.LONG,
      fornecedores: CacheTTL.VERY_LONG,
      categorias: CacheTTL.VERY_LONG,
      anuncios: CacheTTL.SHORT,
      estoque: CacheTTL.MEDIUM
    };
    
    return ttlMap[this.collectionName] || CacheTTL.MEDIUM;
  }

  /**
   * Gerar chave de cache para query
   */
  private generateQueryCacheKey(options: QueryOptions): string {
    const filterStr = options.filters
      ? options.filters
          .map(f => `${f.field}:${f.operator}:${JSON.stringify(f.value)}`)
          .sort()
          .join('|')
      : '';
    
    const optionsStr = JSON.stringify({
      orderByField: options.orderByField,
      orderDirection: options.orderDirection,
      limitCount: options.limitCount
    });
    
    return `query:${this.collectionName}:${filterStr}:${optionsStr}`;
  }

  /**
   * Invalidar cache de um documento específico
   */
  private invalidateDocumentCache(id: string): void {
    const cacheKey = `${this.collectionName}:${id}`;
    cacheService.delete(cacheKey, {
      namespace: this.getCacheNamespace()
    });
  }

  /**
   * Invalidar cache de uma coleção inteira
   */
  private invalidateCollectionCache(): void {
    const namespace = this.getCacheNamespace();
    
    // Invalidar todas as queries da coleção
    cacheService.invalidatePattern(
      new RegExp(`^query:${this.collectionName}:`),
      namespace
    );
    
    // Invalidar documentos individuais
    cacheService.invalidatePattern(
      new RegExp(`^${this.collectionName}:`),
      namespace
    );
  }

  /**
   * Invalidar cache de uma coleção por nome
   */
  private invalidateCollectionCacheByName(collectionName: string): void {
    const namespaceMap: Record<string, string> = {
      usuarios: CacheNamespaces.USERS,
      produtos: CacheNamespaces.PRODUCTS,
      pedidos: CacheNamespaces.ORDERS,
      clientes: CacheNamespaces.CUSTOMERS,
      fornecedores: CacheNamespaces.SUPPLIERS,
      categorias: CacheNamespaces.CATEGORIES,
      anuncios: CacheNamespaces.MERCADOLIVRE,
      estoque: CacheNamespaces.PRODUCTS
    };
    
    const namespace = namespaceMap[collectionName] || CacheNamespaces.SYSTEM;
    
    // Invalidar todas as queries da coleção
    cacheService.invalidatePattern(
      new RegExp(`^query:${collectionName}:`),
      namespace
    );
    
    // Invalidar documentos individuais
    cacheService.invalidatePattern(
      new RegExp(`^${collectionName}:`),
      namespace
    );
  }

  /**
   * Limpar todo o cache da coleção
   */
  clearCache(): void {
    const namespace = this.getCacheNamespace();
    cacheService.clear(namespace);
  }

  /**
   * Obter estatísticas do cache
   */
  getCacheStats() {
    return cacheService.getStats();
  }
}

// Instâncias pré-configuradas para as principais coleções do sistema
export const clientesService = new FirestoreService('clientes');
export const produtosService = new FirestoreService('produtos');
export const pedidosService = new FirestoreService('pedidos');
export const usuariosService = new FirestoreService('usuarios');
export const anunciosService = new FirestoreService('anuncios');
export const estoqueService = new FirestoreService('estoque');
export const scrapsService = new FirestoreService('scraps');
export const scrapPartsService = new FirestoreService('scrapParts');
export const suppliersService = new FirestoreService('suppliers');
export const employeesService = new FirestoreService('employees');
export const financialTransactionsService = new FirestoreService('financialTransactions');
export const financialAttachmentsService = new FirestoreService('financialAttachments');
export const usersService = new FirestoreService('users');

// Função utilitária para criar novos serviços
export const createFirestoreService = (collectionName: string) => {
  return new FirestoreService(collectionName);
};

// Função para limpar todo o cache do Firestore
export const clearAllFirestoreCache = () => {
  Object.values(CacheNamespaces).forEach(namespace => {
    cacheService.clear(namespace);
  });
};

// Exportar tipos para uso em outros módulos
// Tipos já exportados individualmente acima