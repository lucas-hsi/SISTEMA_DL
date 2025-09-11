import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { UserRole } from '../types';

// Tipos do tema
type ThemeMode = 'light' | 'dark';

// Interface do tema para styled-components
interface StyledTheme {
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceHover: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
    };
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}



// Cores por perfil
const ROLE_COLORS = {
  [UserRole.GESTOR]: {
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    accent: '#60a5fa'
  },
  [UserRole.VENDEDOR]: {
    primary: '#10b981',
    secondary: '#059669',
    accent: '#34d399'
  },
  [UserRole.ANUNCIOS]: {
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#fbbf24'
  }
};

// Tema padrão removido - não utilizado

// Função para criar tema baseado no modo e perfil
const createTheme = (mode: ThemeMode, role: UserRole): StyledTheme => {
  const roleColors = ROLE_COLORS[role];
  const isDark = mode === 'dark';
  
  return {
    colors: {
      primary: roleColors.primary,
      primaryDark: roleColors.secondary,
      secondary: roleColors.secondary,
      accent: roleColors.accent,
      background: isDark ? '#0f172a' : '#ffffff',
      surface: isDark ? '#1e293b' : '#f8fafc',
      surfaceHover: isDark ? '#334155' : '#f1f5f9',
      border: isDark ? '#334155' : '#e2e8f0',
      text: {
        primary: isDark ? '#f8fafc' : '#1e293b',
        secondary: isDark ? '#94a3b8' : '#64748b'
      },
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem'
    },
    shadows: {
      sm: isDark ? '0 1px 2px 0 rgba(0, 0, 0, 0.3)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }
  };
};

// Interface do contexto
interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  styledTheme: StyledTheme;
  toggleTheme: () => void;
  setUserRole: (role: UserRole) => void;
  getRoleColors: (role: UserRole) => typeof ROLE_COLORS[keyof typeof ROLE_COLORS];
}

// Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.GESTOR);
  const [styledTheme, setStyledTheme] = useState<StyledTheme>(createTheme('light', UserRole.GESTOR));

  // Carregar tema do localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('dl-theme');
    const savedRole = localStorage.getItem('dl-user-role') as UserRole;
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    } else {
      // Detectar preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
    
    if (savedRole && ROLE_COLORS[savedRole]) {
      setCurrentRole(savedRole);
    }
  }, []);

  // Aplicar tema ao documento
  useEffect(() => {
    const root = document.documentElement;
    
    // Definir atributo data-theme
    root.setAttribute('data-theme', theme);
    
    // Definir variáveis CSS para o perfil atual
    const roleColors = ROLE_COLORS[currentRole];
    root.style.setProperty('--role-primary', roleColors.primary);
    root.style.setProperty('--role-secondary', roleColors.secondary);
    root.style.setProperty('--role-accent', roleColors.accent);
    
    // Atualizar tema do styled-components
    setStyledTheme(createTheme(theme, currentRole));
    
    // Salvar no localStorage
    localStorage.setItem('dl-theme', theme);
    localStorage.setItem('dl-user-role', currentRole);
  }, [theme, currentRole]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setUserRole = (role: UserRole) => {
    setCurrentRole(role);
  };

  const getRoleColors = (role: UserRole) => {
    return ROLE_COLORS[role];
  };

  const value = {
    theme,
    isDark: theme === 'dark',
    styledTheme,
    toggleTheme,
    setUserRole,
    getRoleColors
  };

  return (
    <ThemeContext.Provider value={value}>
      <StyledThemeProvider theme={styledTheme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook personalizado
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};