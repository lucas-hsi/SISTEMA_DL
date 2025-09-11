# Integração Firebase - DL Auto Peças

## Visão Geral

Este documento descreve a integração completa do Firebase Firestore no frontend React do sistema DL Auto Peças. A implementação inclui autenticação, operações CRUD, cache local, tratamento de erros e regras de segurança.

## Estrutura de Arquivos

```
src/
├── services/
│   ├── firebase.ts              # Configuração principal do Firebase
│   ├── firestoreService.ts      # Serviços CRUD do Firestore
│   ├── firebaseAuthService.ts   # Serviços de autenticação
│   └── cacheService.ts          # Sistema de cache local
├── contexts/
│   └── FirebaseContext.tsx      # Contexto React para Firebase
├── components/
│   └── Firebase/
│       ├── FirebaseErrorBoundary.tsx  # Tratamento de erros
│       └── FirebaseLoader.tsx          # Componentes de loading
├── hooks/
│   └── useFirebaseState.ts      # Hooks personalizados
└── .env.example                 # Variáveis de ambiente
```

## Configuração Inicial

### 1. Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=dlautopecas-amb.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dlautopecas-amb
VITE_FIREBASE_STORAGE_BUCKET=dlautopecas-amb.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase Emulators (Development)
VITE_FIREBASE_USE_EMULATORS=false
VITE_FIREBASE_FIRESTORE_HOST=localhost
VITE_FIREBASE_FIRESTORE_PORT=8080
VITE_FIREBASE_AUTH_HOST=localhost
VITE_FIREBASE_AUTH_PORT=9099

# Environment
VITE_ENVIRONMENT=development
```

### 2. Instalação de Dependências

```bash
npm install firebase
```

### 3. Configuração do Firebase Console

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto "dlautopecas-amb"
3. Configure as regras de segurança do Firestore
4. Ative a autenticação por email/senha

## Uso dos Serviços

### Firestore Service

#### Operações Básicas

```typescript
import { firestoreCollections } from '../services/firestoreService';

// Criar documento
const produtoId = await firestoreCollections.produtos.create({
  nome: 'Filtro de Óleo',
  preco: 25.90,
  categoria: 'Filtros',
  tenant_id: 'empresa123'
});

// Ler documento por ID
const produto = await firestoreCollections.produtos.readById(produtoId);

// Ler múltiplos documentos com filtros
const produtos = await firestoreCollections.produtos.readMany({
  filters: [
    { field: 'categoria', operator: '==', value: 'Filtros' },
    { field: 'preco', operator: '<=', value: 50 }
  ],
  orderByField: 'nome',
  orderDirection: 'asc',
  limitCount: 10
});

// Atualizar documento
await firestoreCollections.produtos.update(produtoId, {
  preco: 27.90,
  updated_by: 'user123'
});

// Deletar documento
await firestoreCollections.produtos.delete(produtoId);
```

#### Operações Avançadas

```typescript
// Paginação
const resultado = await firestoreCollections.produtos.readWithPagination({
  filters: [{ field: 'categoria', operator: '==', value: 'Filtros' }],
  pageSize: 20,
  orderByField: 'createdAt'
});

// Listener em tempo real
const unsubscribe = firestoreCollections.produtos.listen(
  { field: 'tenant_id', operator: '==', value: 'empresa123' },
  (produtos) => {
    console.log('Produtos atualizados:', produtos);
  }
);

// Transação
await firestoreCollections.produtos.runTransaction(async (transaction) => {
  const produtoRef = doc(db, 'produtos', produtoId);
  const produto = await transaction.get(produtoRef);
  
  if (produto.exists()) {
    transaction.update(produtoRef, {
      estoque: produto.data().estoque - 1
    });
  }
}, ['produtos', 'estoque']);

// Operação em lote
const batch = firestoreCollections.produtos.createBatch();
batch.create({ nome: 'Produto 1', preco: 10 });
batch.create({ nome: 'Produto 2', preco: 20 });
batch.update('produto123', { preco: 15 });
await batch.commit();
```

### Autenticação Firebase

```typescript
import { useFirebase } from '../contexts/FirebaseContext';

function LoginComponent() {
  const { signIn, user, loading, authError } = useFirebase();
  
  const handleLogin = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      console.log('Login realizado com sucesso');
    } catch (error) {
      console.error('Erro no login:', error);
    }
  };
  
  if (loading) return <FirebaseLoader type="auth" />;
  if (authError) return <div>Erro: {authError.message}</div>;
  
  return (
    <div>
      {user ? (
        <p>Bem-vindo, {user.email}</p>
      ) : (
        <LoginForm onSubmit={handleLogin} />
      )}
    </div>
  );
}
```

### Sistema de Cache

```typescript
import { cacheService, CacheNamespaces, CacheTTL } from '../services/cacheService';

// Usar cache manualmente
cacheService.set('produtos:lista', produtos, {
  namespace: CacheNamespaces.PRODUCTS,
  ttl: CacheTTL.LONG
});

const produtosCached = cacheService.get('produtos:lista', {
  namespace: CacheNamespaces.PRODUCTS
});

// Cache com fallback
const produtos = await cacheService.getOrSet(
  'produtos:categoria:filtros',
  () => firestoreCollections.produtos.readMany({
    filters: [{ field: 'categoria', operator: '==', value: 'Filtros' }]
  }),
  {
    namespace: CacheNamespaces.PRODUCTS,
    ttl: CacheTTL.MEDIUM
  }
);

// Invalidar cache
cacheService.invalidatePattern(/^produtos:/, CacheNamespaces.PRODUCTS);
```

### Hooks Personalizados

```typescript
import { useFirebaseState, useFirebaseCache } from '../hooks/useFirebaseState';

function ProductList() {
  const productState = useFirebaseState([]);
  
  const loadProducts = async () => {
    await productState.execute(
      () => firestoreCollections.produtos.readMany(),
      {
        onSuccess: (data) => console.log('Produtos carregados:', data.length),
        onError: (error) => console.error('Erro ao carregar produtos:', error),
        retryable: true,
        maxRetries: 3
      }
    );
  };
  
  // Cache com hook
  const { data: cachedProducts, fetchWithCache } = useFirebaseCache(
    'products:all',
    () => firestoreCollections.produtos.readMany(),
    { ttl: CacheTTL.MEDIUM }
  );
  
  if (productState.loading) return <FirebaseLoader type="firestore" />;
  if (productState.error) return <div>Erro: {productState.getErrorMessage()}</div>;
  
  return (
    <div>
      <button onClick={loadProducts}>Carregar Produtos</button>
      <button onClick={() => fetchWithCache(true)}>Atualizar Cache</button>
      {productState.data?.map(product => (
        <div key={product.id}>{product.nome}</div>
      ))}
    </div>
  );
}
```

### Tratamento de Erros

```typescript
import { FirebaseErrorBoundary, useFirebaseErrorHandler } from '../components/Firebase/FirebaseErrorBoundary';

function App() {
  return (
    <FirebaseErrorBoundary>
      <YourAppComponents />
    </FirebaseErrorBoundary>
  );
}

function ComponentWithErrorHandling() {
  const errorHandler = useFirebaseErrorHandler();
  
  const handleOperation = async () => {
    try {
      await firestoreCollections.produtos.create(productData);
    } catch (error) {
      errorHandler.handleError(error, 'Criação de produto');
    }
  };
}
```

## Regras de Segurança

As regras de segurança estão configuradas no arquivo `firestore.rules` e implementam:

### Controle de Acesso por Inquilino

```javascript
// Verificar se o usuário pertence ao inquilino
function belongsToTenant(tenantId) {
  return request.auth != null && 
         request.auth.token.tenant_id == tenantId;
}

// Produtos - acesso baseado no inquilino
match /products/{productId} {
  allow read: if canRead(resource.data.tenant_id);
  allow write: if canWrite(resource.data.tenant_id);
}
```

### Perfis de Usuário

- **Gestor**: Acesso total ao inquilino
- **Vendedor**: Acesso de leitura/escrita limitado
- **Anúncios**: Acesso específico para integração Mercado Livre
- **Admin**: Acesso de sistema (super usuário)

### Estrutura de Token JWT

```json
{
  "tenant_id": "empresa123",
  "role": "gestor",
  "uid": "user123"
}
```

## Estrutura de Dados

### Documento Base

Todos os documentos devem incluir:

```typescript
interface BaseDocument {
  id: string;
  tenant_id: string;        // Isolamento por inquilino
  created_at: Timestamp;    // Data de criação
  updated_at: Timestamp;    // Data de atualização
  created_by: string;       // ID do usuário criador
  updated_by: string;       // ID do último usuário que atualizou
}
```

### Coleções Principais

#### Produtos
```typescript
interface Product extends BaseDocument {
  nome: string;
  descricao?: string;
  preco: number;
  categoria_id: string;
  fornecedor_id?: string;
  codigo_interno?: string;
  codigo_barras?: string;
  ativo: boolean;
}
```

#### Clientes
```typescript
interface Customer extends BaseDocument {
  nome: string;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
  endereco?: Address;
  ativo: boolean;
}
```

#### Pedidos
```typescript
interface Order extends BaseDocument {
  cliente_id: string;
  status: 'pendente' | 'processando' | 'enviado' | 'entregue' | 'cancelado';
  total: number;
  itens: OrderItem[];
  data_entrega?: Timestamp;
}
```

## Performance e Otimização

### Índices Recomendados

```javascript
// No Firebase Console, criar índices compostos:
// Collection: products
// Fields: tenant_id (Ascending), categoria_id (Ascending), created_at (Descending)

// Collection: orders
// Fields: tenant_id (Ascending), status (Ascending), created_at (Descending)

// Collection: customers
// Fields: tenant_id (Ascending), ativo (Ascending), nome (Ascending)
```

### Estratégias de Cache

1. **Cache de Sessão**: Dados do usuário (24h)
2. **Cache Longo**: Categorias, fornecedores (2h)
3. **Cache Médio**: Produtos, clientes (30min)
4. **Cache Curto**: Dados do Mercado Livre (1min)

### Paginação Eficiente

```typescript
// Usar cursor-based pagination
const { documents, lastDoc, hasMore } = await firestoreCollections.produtos.readWithPagination({
  pageSize: 20,
  orderByField: 'created_at',
  orderDirection: 'desc',
  startAfterDoc: lastDocument // Para próxima página
});
```

## Monitoramento e Logs

### Logs de Auditoria

```typescript
// Automaticamente criados para operações importantes
interface AuditLog {
  tenant_id: string;
  user_id: string;
  action: 'create' | 'update' | 'delete';
  collection: string;
  document_id: string;
  changes?: any;
  timestamp: Timestamp;
  ip_address?: string;
}
```

### Estatísticas de Cache

```typescript
// Monitorar performance do cache
const stats = cacheService.getStats();
console.log(`Hit Rate: ${stats.hitRate}%`);
console.log(`Entries: ${stats.entries}`);
console.log(`Size: ${stats.size} bytes`);
```

## Desenvolvimento e Testes

### Emuladores Firebase

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Inicializar emuladores
firebase init emulators

# Executar emuladores
firebase emulators:start
```

### Configuração para Desenvolvimento

```env
# .env.development
VITE_FIREBASE_USE_EMULATORS=true
VITE_FIREBASE_FIRESTORE_HOST=localhost
VITE_FIREBASE_FIRESTORE_PORT=8080
VITE_FIREBASE_AUTH_HOST=localhost
VITE_FIREBASE_AUTH_PORT=9099
```

### Testes

```typescript
// Exemplo de teste com emuladores
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectAuthEmulator } from 'firebase/auth';

if (process.env.NODE_ENV === 'test') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

## Troubleshooting

### Problemas Comuns

1. **Erro de Permissão**
   - Verificar regras de segurança
   - Confirmar token JWT com campos corretos
   - Validar tenant_id nos documentos

2. **Performance Lenta**
   - Verificar índices no Firebase Console
   - Otimizar queries com filtros
   - Implementar paginação adequada

3. **Cache Não Funcionando**
   - Verificar TTL configurado
   - Confirmar namespace correto
   - Limpar cache se necessário

4. **Erro de Conexão**
   - Verificar variáveis de ambiente
   - Confirmar configuração do Firebase
   - Testar conectividade de rede

### Debug

```typescript
// Habilitar logs detalhados
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Verificar status da conexão
const checkConnection = async () => {
  try {
    await enableNetwork(db);
    console.log('Firestore conectado');
  } catch (error) {
    console.error('Erro de conexão:', error);
  }
};

// Logs de cache
console.log('Cache Stats:', cacheService.getStats());
```

## Manutenção

### Tarefas Regulares

1. **Mensal**
   - Revisar regras de segurança
   - Analisar logs de acesso negado
   - Otimizar índices baseado no uso

2. **Semanal**
   - Monitorar performance das queries
   - Verificar hit rate do cache
   - Limpar dados temporários

3. **Diário**
   - Verificar logs de erro
   - Monitorar uso de recursos
   - Backup de dados críticos

### Atualizações

```bash
# Atualizar Firebase SDK
npm update firebase

# Verificar breaking changes
npm audit
```

## Conclusão

A integração Firebase está completa e pronta para produção. O sistema implementa:

✅ **Configuração completa** do Firebase SDK  
✅ **Serviços CRUD** otimizados com cache  
✅ **Autenticação** integrada ao sistema existente  
✅ **Tratamento de erros** robusto  
✅ **Regras de segurança** por inquilino e perfil  
✅ **Cache local** para performance  
✅ **Componentes React** reutilizáveis  
✅ **Hooks personalizados** para facilitar o uso  
✅ **Documentação completa** para manutenção  

Para suporte adicional, consulte a [documentação oficial do Firebase](https://firebase.google.com/docs) ou entre em contato com a equipe de desenvolvimento.