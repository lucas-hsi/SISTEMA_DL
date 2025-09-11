// Exportar todos os serviços
export { httpClient } from './httpClient';
export { authService } from './authService';
export { tokenService } from './tokenService';

// Firebase
export { db, auth, storage, firebaseSettings } from './firebase';

// Serviços de Sucatas
export {
  ScrapService,
  ScrapPartService,
  SupplierService
} from './scrapService';

// Serviços de Funcionários
export {
  EmployeeService,
  PermissionService
} from './employeeService';

// Serviços de Calendário
export {
  CalendarService,
  EventAttachmentService
} from './calendarService';

// Serviços Financeiros
export {
  FinancialService,
  FinancialAttachmentService
} from './financialService';

// Serviços de Workflows
export {
  WorkflowService,
  WorkflowStepService,
  WorkflowExecutionService
} from './workflowService';

// Configurações da API
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
};

// Utilitários de API
export const apiUtils = {
  // Formatar erro para exibição
  formatError: (error: any): string => {
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.message) {
      return error.message;
    }
    return 'Erro desconhecido';
  },

  // Verificar se é erro de rede
  isNetworkError: (error: any): boolean => {
    return !error.response && error.request;
  },

  // Verificar se é erro de autenticação
  isAuthError: (error: any): boolean => {
    return error.response?.status === 401;
  },

  // Verificar se é erro de permissão
  isPermissionError: (error: any): boolean => {
    return error.response?.status === 403;
  },

  // Verificar se é erro de validação
  isValidationError: (error: any): boolean => {
    return error.response?.status === 422;
  }
};