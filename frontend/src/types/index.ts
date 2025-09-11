// Re-exportar todos os tipos
export * from './auth';

// Tipos de componentes UI
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  id?: string;
  name?: string;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  style?: React.CSSProperties;
}

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  color?: string;
  text?: string;
  message?: string;
}

// Tipos de validação
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message?: string;
  custom?: (value: any, allValues?: any) => boolean;
}

export interface FormField {
  value: string;
  error: string | null;
  touched: boolean;
  rules: ValidationRule[];
}

// Tipos de notificação
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Tipos de modal
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlay?: boolean;
}

// Tipos de sidebar
export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string | number;
  children?: SidebarItem[];
}

export interface SidebarProps {
  items: SidebarItem[];
  collapsed: boolean;
  onToggle: () => void;
  userRole: string;
}

// Tipos de API
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// Tipos de configuração
export interface AppConfig {
  apiUrl: string;
  appName: string;
  version: string;
  environment: 'development' | 'production' | 'staging';
}