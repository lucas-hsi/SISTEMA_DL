'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FiSearch, FiPlus, FiTrash2, FiShoppingCart, FiUser, FiCheck, FiX } from 'react-icons/fi';
import PageTitle from '@/components/ui/PageTitle';
import ClientFormModal from '@/components/clients/ClientFormModal';
import api from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  client_type: string;
  contact_person?: string;
  document?: string;
  address?: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  sale_price: number;
  stock_quantity: number;
  brand?: string;
  description?: string;
  part_number?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  sale_price: number;
}

interface FormState {
  selectedClient: Client | null;
  cartItems: CartItem[];
  isLoading: boolean;
  submitMessage: string;
  submitError: string;
}

const NovaVendaPage = () => {
  const { user, isLoading: isLoadingAuth } = useAuth();
  
  // Estados consolidados para melhor organização
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  
  // Estados para busca de clientes
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  
  // Estados para busca de produtos
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Função otimizada para buscar clientes com debounce
  const searchClients = useCallback(async (query: string) => {
    if (!query.trim()) {
      setClientResults([]);
      return;
    }
    
    setLoadingClients(true);
    setSubmitError(''); // Limpar erros anteriores
    
    try {
      const response = await api.get(`/api/v1/clients?search=${encodeURIComponent(query)}`);
      const clients = response.data.items || response.data || [];
      setClientResults(clients);
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error);
      setClientResults([]);
      if (error.response?.status !== 404) {
        setSubmitError('Erro ao buscar clientes. Tente novamente.');
      }
    } finally {
      setLoadingClients(false);
    }
  }, []);

  // Função otimizada para buscar produtos com debounce
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProductResults([]);
      return;
    }
    
    setLoadingProducts(true);
    setSubmitError(''); // Limpar erros anteriores
    
    try {
      const response = await api.get(`/api/v1/products?search=${encodeURIComponent(query)}`);
      const products = response.data.items || response.data || [];
      
      // Converter e validar tipos de dados para garantir consistência
      const normalizedProducts = products.map((product: any) => ({
        ...product,
        sale_price: parseFloat(product.sale_price) || 0,
        stock_quantity: parseInt(product.stock_quantity) || 0,
        description: product.description || '',
        brand: product.brand || '',
        part_number: product.part_number || ''
      }));
      
      setProductResults(normalizedProducts);
    } catch (error: any) {
      console.error('Erro ao buscar produtos:', error);
      setProductResults([]);
      if (error.response?.status !== 404) {
        setSubmitError('Erro ao buscar produtos. Tente novamente.');
      }
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Função otimizada para adicionar produto ao carrinho
  const addToCart = useCallback((product: Product) => {
    if (product.stock_quantity <= 0) {
      setSubmitError('Produto sem estoque disponível.');
      return;
    }
    
    const existingItem = cartItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      if (newQuantity > product.stock_quantity) {
        setSubmitError(`Quantidade máxima disponível em estoque: ${product.stock_quantity}`);
        return;
      }
      
      setCartItems(cartItems.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        product,
        quantity: 1,
        sale_price: product.sale_price
      }]);
    }
    
    setProductSearch('');
    setProductResults([]);
    setSubmitError(''); // Limpar erros ao adicionar com sucesso
  }, [cartItems]);

  // Função otimizada para atualizar quantidade no carrinho
  const updateCartQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    // Verificar estoque disponível
    const item = cartItems.find(item => item.product.id === productId);
    if (item && quantity > item.product.stock_quantity) {
      setSubmitError(`Quantidade máxima disponível em estoque: ${item.product.stock_quantity}`);
      return;
    }
    
    setCartItems(cartItems.map(item => 
      item.product.id === productId 
        ? { ...item, quantity }
        : item
    ));
    setSubmitError(''); // Limpar erro se quantidade válida
  }, [cartItems]);

  // Função otimizada para atualizar preço no carrinho
  const updateCartPrice = useCallback((productId: number, price: number) => {
    if (price < 0) {
      setSubmitError('O preço não pode ser negativo.');
      return;
    }
    
    setCartItems(cartItems.map(item => 
      item.product.id === productId 
        ? { ...item, sale_price: price }
        : item
    ));
    setSubmitError(''); // Limpar erro se preço válido
  }, [cartItems]);

  // Função otimizada para remover do carrinho
  const removeFromCart = useCallback((productId: number) => {
    setCartItems(cartItems.filter(item => item.product.id !== productId));
    setSubmitError(''); // Limpar erro ao remover item
  }, [cartItems]);

  // Função otimizada para calcular total com memoização
  const calculateTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + (item.quantity * item.sale_price), 0);
  }, [cartItems]);

  // Função para validações comuns
  const validateForm = useCallback(() => {
    if (!selectedClient) {
      setSubmitError('Selecione um cliente para continuar');
      return false;
    }
    
    if (cartItems.length === 0) {
      setSubmitError('Adicione pelo menos um produto ao carrinho');
      return false;
    }
    
    if (!user || !user.id) {
      setSubmitError('Usuário não autenticado. Faça login novamente.');
      return false;
    }
    
    if (!user.company_id) {
      setSubmitError('Dados da empresa não encontrados. Entre em contato com o administrador.');
      return false;
    }

    const stockErrors = cartItems.filter(item => item.quantity > item.product.stock_quantity);
    if (stockErrors.length > 0) {
      setSubmitError(`Produtos com estoque insuficiente: ${stockErrors.map(item => item.product.name).join(', ')}`);
      return false;
    }

    const priceErrors = cartItems.filter(item => item.sale_price <= 0);
    if (priceErrors.length > 0) {
      setSubmitError(`Produtos com preço inválido: ${priceErrors.map(item => item.product.name).join(', ')}`);
      return false;
    }
    
    return true;
  }, [selectedClient, cartItems, user]);

  // Função para construir payload do pedido
  const buildOrderPayload = useCallback(() => {
    return {
      client_id: selectedClient!.id,
      user_id: user!.id,
      company_id: user!.company_id,
      items: cartItems.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        sale_price: item.sale_price
      }))
    };
  }, [selectedClient, cartItems, user]);

  // Função para limpar formulário
  const clearForm = useCallback(() => {
    setSelectedClient(null);
    setCartItems([]);
    setClientSearch('');
    setProductSearch('');
    setClientResults([]);
    setProductResults([]);
  }, []);

  // Função para salvar orçamento (sem baixa de estoque)
  const handleSaveQuote = useCallback(async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setSubmitError('');
    setSubmitMessage('');
    
    try {
      const orderData = buildOrderPayload();
      console.log('Salvando orçamento:', orderData);
      
      const response = await api.post('/api/v1/orders', orderData);
      
      setSubmitMessage('Orçamento salvo com sucesso!');
      clearForm();
      
      console.log('Orçamento salvo:', response.data);
      
    } catch (error: any) {
      console.error('Erro ao salvar orçamento:', error.response?.data);
      
      let friendlyErrorMessage = 'Ocorreu um erro ao salvar o orçamento. Verifique os dados e tente novamente.';
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          const firstError = error.response.data.detail[0];
          friendlyErrorMessage = `Erro no campo '${firstError.loc[firstError.loc.length - 1]}': ${firstError.msg}`;
        } else if (typeof error.response.data.detail === 'string') {
          friendlyErrorMessage = error.response.data.detail;
        }
      } else if (error.response?.status === 404) {
        friendlyErrorMessage = 'Serviço não encontrado. Verifique se o backend está rodando.';
      } else if (error.response?.status === 422) {
        friendlyErrorMessage = 'Dados inválidos. Verifique todos os campos e tente novamente.';
      } else if (error.response?.status >= 500) {
        friendlyErrorMessage = 'Erro interno do servidor. Tente novamente em alguns instantes.';
      }
      
      setSubmitError(friendlyErrorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, buildOrderPayload, clearForm]);

  // Função para finalizar venda (com baixa de estoque)
  const handleFinalizeSale = useCallback(async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setSubmitError('');
    setSubmitMessage('');
    
    try {
      const orderData = buildOrderPayload();
      console.log('Criando orçamento para conversão em venda:', orderData);
      
      // Primeira chamada: criar orçamento
      const createResponse = await api.post('/api/v1/orders', orderData);
      const orderId = createResponse.data.id;
      
      console.log('Orçamento criado, convertendo para venda. Order ID:', orderId);
      
      // Segunda chamada: converter para venda
      await api.post(`/api/v1/orders/${orderId}/convert-to-sale`);
      
      setSubmitMessage('Venda finalizada com sucesso!');
      clearForm();
      
      console.log('Venda finalizada com sucesso');
      
    } catch (error: any) {
      console.error('Erro ao finalizar venda:', error.response?.data);
      
      let friendlyErrorMessage = 'Ocorreu um erro ao finalizar a venda. Verifique os dados e tente novamente.';
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          const firstError = error.response.data.detail[0];
          friendlyErrorMessage = `Erro no campo '${firstError.loc[firstError.loc.length - 1]}': ${firstError.msg}`;
        } else if (typeof error.response.data.detail === 'string') {
          friendlyErrorMessage = error.response.data.detail;
        }
      } else if (error.response?.status === 404) {
        friendlyErrorMessage = 'Serviço não encontrado. Verifique se o backend está rodando.';
      } else if (error.response?.status === 422) {
        friendlyErrorMessage = 'Dados inválidos. Verifique todos os campos e tente novamente.';
      } else if (error.response?.status >= 500) {
        friendlyErrorMessage = 'Erro interno do servidor. Tente novamente em alguns instantes.';
      }
      
      setSubmitError(friendlyErrorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, buildOrderPayload, clearForm]);

  // Effects para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (clientSearch) {
        searchClients(clientSearch);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [clientSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (productSearch) {
        searchProducts(productSearch);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Auto-clear das mensagens de feedback após 5 segundos
  useEffect(() => {
    if (submitMessage) {
      const timer = setTimeout(() => {
        setSubmitMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitMessage]);

  useEffect(() => {
    if (submitError) {
      const timer = setTimeout(() => {
        setSubmitError('');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [submitError]);

  if (isLoadingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div>Verificando autenticação...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Novo Orçamento" colorScheme="vendedor" />
      
      {/* Mensagens de feedback melhoradas */}
      {submitMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <FiCheck className="mr-2 text-green-600" />
          <div>
            <p className="font-medium">{submitMessage}</p>
            <p className="text-sm text-green-600 mt-1">Você pode criar um novo orçamento abaixo.</p>
          </div>
        </div>
      )}
      
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
          <FiX className="mr-2 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Erro ao criar orçamento</p>
            <p className="text-sm text-red-600 mt-1">{submitError}</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Seleção de Cliente */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiUser className="mr-2" />
                Cliente
              </h2>
              <button
                onClick={() => setShowClientModal(true)}
                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 flex items-center"
              >
                <FiPlus className="mr-1" />
                Novo Cliente
              </button>
            </div>
            
            {selectedClient ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 flex items-center">
                      <FiUser className="mr-2" />
                      {selectedClient.name}
                    </h3>
                    {selectedClient.email && (
                      <p className="text-sm text-blue-700 mt-1">{selectedClient.email}</p>
                    )}
                    {selectedClient.phone && (
                      <p className="text-sm text-blue-700">{selectedClient.phone}</p>
                    )}
                    {selectedClient.contact_person && (
                      <p className="text-sm text-blue-700">Contato: {selectedClient.contact_person}</p>
                    )}
                    {selectedClient.document && (
                      <p className="text-sm text-blue-700">Doc: {selectedClient.document}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {selectedClient.client_type}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Remover cliente selecionado"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente por nome..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {loadingClients && (
                  <div className="text-center py-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                )}
                
                {clientResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    {clientResults.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => {
                          setSelectedClient(client);
                          setClientSearch('');
                          setClientResults([]);
                        }}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-600">{client.email}</div>
                        <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mt-1">
                          {client.client_type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Coluna 2: Produtos e Carrinho */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiShoppingCart className="mr-2" />
              Produtos
            </h2>
            
            {/* Busca de produtos */}
            <div className="mb-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produto por nome ou SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {loadingProducts && (
                <div className="text-center py-2 mt-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              )}
              
              {productResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {productResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      disabled={product.stock_quantity <= 0}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-600">SKU: {product.sku}</div>
                          {product.brand && (
                            <div className="text-sm text-gray-600">Marca: {product.brand}</div>
                          )}
                          {product.part_number && (
                            <div className="text-sm text-gray-600">Código: {product.part_number}</div>
                          )}
                          <div className="text-sm font-medium text-green-600">
                            R$ {product.sale_price.toFixed(2)}
                          </div>
                          {product.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {product.description}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            product.stock_quantity > 10 
                              ? 'bg-green-100 text-green-800' 
                              : product.stock_quantity > 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            Estoque: {product.stock_quantity}
                          </span>
                          {product.stock_quantity <= 0 && (
                            <div className="text-xs text-red-600 mt-1">Sem estoque</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Carrinho */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Carrinho ({cartItems.length} itens)</h3>
              
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Nenhum produto adicionado</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{item.product.name}</h4>
                          <p className="text-xs text-gray-600">SKU: {item.product.sku}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Quantidade</label>
                          <input
                            type="number"
                            min="1"
                            max={item.product.stock_quantity}
                            value={item.quantity}
                            onChange={(e) => updateCartQuantity(item.product.id, parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Preço Unit.</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.sale_price}
                            onChange={(e) => updateCartPrice(item.product.id, parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-2 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          Subtotal: R$ {(item.quantity * item.sale_price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Coluna 3: Resumo e Finalização */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Pedido</h2>
            
            <div className="space-y-4">
              {/* Informações do cliente */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Cliente</h3>
                {selectedClient ? (
                  <div className="text-sm text-gray-600">
                    <p>{selectedClient.name}</p>
                    <p>{selectedClient.email}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhum cliente selecionado</p>
                )}
              </div>
              
              {/* Resumo dos itens */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Itens ({cartItems.length})</h3>
                {cartItems.length > 0 ? (
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.product.id} className="flex justify-between text-sm">
                        <span className="text-gray-600 flex-1 mr-2">
                          {item.quantity}x {item.product.name}
                        </span>
                        <span className="font-medium text-green-600">
                          R$ {(item.quantity * item.sale_price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhum item adicionado</p>
                )}
              </div>
              
              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-green-600">
                    R$ {calculateTotal.toFixed(2)}
                  </span>
                </div>
                {cartItems.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
                  </div>
                )}
              </div>
              
              {/* Botões de finalização */}
              <div className="space-y-3">
                {/* Botão Finalizar Venda (Primário) */}
                <button
                  onClick={handleFinalizeSale}
                  disabled={!selectedClient || cartItems.length === 0 || isLoading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Finalizando Venda...
                    </>
                  ) : (
                    <>
                      <FiCheck className="mr-2" />
                      Finalizar Venda
                    </>
                  )}
                </button>
                
                {/* Botão Salvar Orçamento (Secundário) */}
                <button
                  onClick={handleSaveQuote}
                  disabled={!selectedClient || cartItems.length === 0 || isLoading}
                  className="w-full bg-white text-gray-700 py-3 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Salvando Orçamento...
                    </>
                  ) : (
                    <>
                      <FiShoppingCart className="mr-2" />
                      Salvar Orçamento
                    </>
                  )}
                </button>
              </div>
              
              {(!selectedClient || cartItems.length === 0) && (
                <div className="text-xs text-gray-500 text-center space-y-1">
                  <p>
                    {!selectedClient && 'Selecione um cliente'}
                    {!selectedClient && cartItems.length === 0 && ' e '}
                    {cartItems.length === 0 && 'adicione produtos'}
                    {' para continuar'}
                  </p>
                  <p className="text-xs text-gray-400">
                    <strong>Finalizar Venda:</strong> Cria pedido e baixa estoque<br/>
                    <strong>Salvar Orçamento:</strong> Apenas salva sem baixar estoque
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de novo cliente */}
      <ClientFormModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        mode="create"
        onSuccess={() => {
          setShowClientModal(false);
          // Recarregar lista de clientes se necessário
        }}
      />
    </div>
  );
};

export default NovaVendaPage;