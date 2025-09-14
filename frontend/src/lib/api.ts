import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar automaticamente o token JWT nas requisições
api.interceptors.request.use(
  (config) => {
    // Verificar se estamos no lado do cliente (browser)
    if (typeof window !== 'undefined') {
      // Priorizar access_token, mas manter compatibilidade com token
      const accessToken = localStorage.getItem('access_token');
      const token = localStorage.getItem('token');
      const authToken = accessToken || token;
      
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros de autenticação
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Se receber 401 (Unauthorized), redirecionar para login
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Limpar todos os dados de autenticação
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('selectedRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;