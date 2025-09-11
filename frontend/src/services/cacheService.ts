// Tipos para o sistema de cache
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
  key: string;
  version?: string;
}

export interface CacheOptions {
  ttl?: number; // Padrão: 5 minutos
  version?: string;
  namespace?: string;
  compress?: boolean;
  encrypt?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
  hitRate: number;
}

/**
 * Serviço de cache local para otimizar operações Firebase
 * Implementa cache em memória e localStorage com TTL
 */
class CacheService {
  private memoryCache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    entries: 0,
    hitRate: 0
  };
  
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_MEMORY_ENTRIES = 1000;
  private readonly STORAGE_PREFIX = 'dl_firebase_cache_';
  
  constructor() {
    this.initializeCache();
    this.startCleanupInterval();
  }

  /**
   * Inicializar cache e carregar dados do localStorage
   */
  private initializeCache(): void {
    try {
      // Carregar estatísticas do localStorage
      const savedStats = localStorage.getItem(`${this.STORAGE_PREFIX}stats`);
      if (savedStats) {
        this.stats = { ...this.stats, ...JSON.parse(savedStats) };
      }
      
      // Limpar entradas expiradas do localStorage
      this.cleanupLocalStorage();
    } catch (error) {
      console.warn('Erro ao inicializar cache:', error);
    }
  }

  /**
   * Iniciar intervalo de limpeza automática
   */
  private startCleanupInterval(): void {
    // Limpar cache a cada 10 minutos
    setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

  /**
   * Gerar chave de cache
   */
  private generateKey(key: string, namespace?: string): string {
    const prefix = namespace ? `${namespace}:` : '';
    return `${prefix}${key}`;
  }

  /**
   * Verificar se uma entrada está válida
   */
  private isValid(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }

  /**
   * Comprimir dados (simulação - em produção usar biblioteca real)
   */
  private compress(data: any): string {
    // Em produção, usar uma biblioteca como lz-string
    return JSON.stringify(data);
  }

  /**
   * Descomprimir dados
   */
  private decompress(data: string): any {
    return JSON.parse(data);
  }

  /**
   * Salvar entrada no localStorage
   */
  private saveToLocalStorage(key: string, entry: CacheEntry): void {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${key}`;
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('Erro ao salvar no localStorage:', error);
      // Se localStorage estiver cheio, limpar entradas antigas
      this.cleanupLocalStorage();
    }
  }

  /**
   * Carregar entrada do localStorage
   */
  private loadFromLocalStorage(key: string): CacheEntry | null {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${key}`;
      const data = localStorage.getItem(storageKey);
      
      if (!data) return null;
      
      const entry: CacheEntry = JSON.parse(data);
      
      if (!this.isValid(entry)) {
        localStorage.removeItem(storageKey);
        return null;
      }
      
      return entry;
    } catch (error) {
      console.warn('Erro ao carregar do localStorage:', error);
      return null;
    }
  }

  /**
   * Atualizar estatísticas
   */
  private updateStats(hit: boolean): void {
    if (hit) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
    
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    this.stats.entries = this.memoryCache.size;
    
    // Salvar estatísticas no localStorage
    try {
      localStorage.setItem(`${this.STORAGE_PREFIX}stats`, JSON.stringify(this.stats));
    } catch (error) {
      console.warn('Erro ao salvar estatísticas:', error);
    }
  }

  /**
   * Definir valor no cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const {
      ttl = this.DEFAULT_TTL,
      version = '1.0',
      namespace,
      compress = false
    } = options;
    
    const cacheKey = this.generateKey(key, namespace);
    const entry: CacheEntry<T> = {
      data: compress ? this.compress(data) as T : data,
      timestamp: Date.now(),
      ttl,
      key: cacheKey,
      version
    };
    
    // Salvar na memória
    this.memoryCache.set(cacheKey, entry);
    
    // Salvar no localStorage para persistência
    this.saveToLocalStorage(cacheKey, entry);
    
    // Limitar tamanho do cache em memória
    if (this.memoryCache.size > this.MAX_MEMORY_ENTRIES) {
      this.evictOldest();
    }
    
    this.updateStats(false); // Não é um hit, é uma inserção
  }

  /**
   * Obter valor do cache
   */
  get<T>(key: string, options: CacheOptions = {}): T | null {
    const { namespace, compress = false } = options;
    const cacheKey = this.generateKey(key, namespace);
    
    // Tentar carregar da memória primeiro
    let entry = this.memoryCache.get(cacheKey);
    
    // Se não estiver na memória, tentar localStorage
    if (!entry) {
      entry = this.loadFromLocalStorage(cacheKey) || undefined;
      
      // Se encontrou no localStorage, adicionar à memória
      if (entry) {
        this.memoryCache.set(cacheKey, entry);
      }
    }
    
    if (!entry) {
      this.updateStats(false); // Miss
      return null;
    }
    
    // Verificar se ainda é válido
    if (!this.isValid(entry)) {
      this.delete(key, { namespace });
      this.updateStats(false); // Miss
      return null;
    }
    
    this.updateStats(true); // Hit
    
    // Descomprimir se necessário
    return compress ? this.decompress(entry.data as string) : entry.data;
  }

  /**
   * Verificar se uma chave existe no cache
   */
  has(key: string, options: CacheOptions = {}): boolean {
    return this.get(key, options) !== null;
  }

  /**
   * Remover entrada do cache
   */
  delete(key: string, options: CacheOptions = {}): boolean {
    const { namespace } = options;
    const cacheKey = this.generateKey(key, namespace);
    
    // Remover da memória
    const memoryDeleted = this.memoryCache.delete(cacheKey);
    
    // Remover do localStorage
    try {
      localStorage.removeItem(`${this.STORAGE_PREFIX}${cacheKey}`);
    } catch (error) {
      console.warn('Erro ao remover do localStorage:', error);
    }
    
    return memoryDeleted;
  }

  /**
   * Limpar todo o cache
   */
  clear(namespace?: string): void {
    if (namespace) {
      // Limpar apenas o namespace específico
      const prefix = `${namespace}:`;
      
      // Limpar memória
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(prefix)) {
          this.memoryCache.delete(key);
        }
      }
      
      // Limpar localStorage
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${this.STORAGE_PREFIX}${prefix}`)) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.warn('Erro ao limpar localStorage:', error);
      }
    } else {
      // Limpar tudo
      this.memoryCache.clear();
      this.cleanupLocalStorage();
    }
  }

  /**
   * Remover entrada mais antiga da memória
   */
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  /**
   * Limpeza geral do cache
   */
  cleanup(): void {
    // Limpar memória
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValid(entry)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Limpar localStorage
    this.cleanupLocalStorage();
  }

  /**
   * Limpar localStorage
   */
  private cleanupLocalStorage(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const entry: CacheEntry = JSON.parse(data);
              if (!this.isValid(entry)) {
                keysToRemove.push(key);
              }
            }
          } catch (error) {
            // Se não conseguir parsear, remover
            keysToRemove.push(key);
          }
        }
      }
      
      // Remover chaves expiradas
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Erro na limpeza do localStorage:', error);
    }
  }

  /**
   * Obter estatísticas do cache
   */
  getStats(): CacheStats {
    this.stats.size = this.getSize();
    this.stats.entries = this.memoryCache.size;
    return { ...this.stats };
  }

  /**
   * Obter tamanho aproximado do cache em bytes
   */
  private getSize(): number {
    let size = 0;
    
    try {
      // Calcular tamanho do localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            size += key.length + value.length;
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao calcular tamanho do cache:', error);
    }
    
    return size;
  }

  /**
   * Cache com fallback para função
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Tentar obter do cache primeiro
    const cached = this.get<T>(key, options);
    
    if (cached !== null) {
      return cached;
    }
    
    // Se não estiver no cache, buscar dados
    try {
      const data = await fetcher();
      this.set(key, data, options);
      return data;
    } catch (error) {
      console.error('Erro ao buscar dados para cache:', error);
      throw error;
    }
  }

  /**
   * Invalidar cache baseado em padrão
   */
  invalidatePattern(pattern: RegExp, namespace?: string): number {
    let count = 0;
    const prefix = namespace ? `${namespace}:` : '';
    
    // Invalidar memória
    for (const key of this.memoryCache.keys()) {
      const testKey = key.startsWith(prefix) ? key.substring(prefix.length) : key;
      if (pattern.test(testKey)) {
        this.memoryCache.delete(key);
        count++;
      }
    }
    
    // Invalidar localStorage
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        
        if (storageKey && storageKey.startsWith(`${this.STORAGE_PREFIX}${prefix}`)) {
          const cacheKey = storageKey.substring(this.STORAGE_PREFIX.length + prefix.length);
          if (pattern.test(cacheKey)) {
            keysToRemove.push(storageKey);
          }
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        count++;
      });
    } catch (error) {
      console.warn('Erro ao invalidar padrão no localStorage:', error);
    }
    
    return count;
  }
}

// Instância singleton do serviço de cache
export const cacheService = new CacheService();

// Namespaces predefinidos para organização
export const CacheNamespaces = {
  USERS: 'users',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  CUSTOMERS: 'customers',
  SUPPLIERS: 'suppliers',
  CATEGORIES: 'categories',
  MERCADOLIVRE: 'mercadolivre',
  AUTH: 'auth',
  SYSTEM: 'system'
} as const;

// TTLs predefinidos para diferentes tipos de dados
export const CacheTTL = {
  SHORT: 1 * 60 * 1000,      // 1 minuto
  MEDIUM: 5 * 60 * 1000,     // 5 minutos
  LONG: 30 * 60 * 1000,      // 30 minutos
  VERY_LONG: 2 * 60 * 60 * 1000, // 2 horas
  SESSION: 24 * 60 * 60 * 1000   // 24 horas
} as const;

export default cacheService;