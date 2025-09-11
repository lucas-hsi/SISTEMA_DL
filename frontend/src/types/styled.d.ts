import 'styled-components';

// Definição do tema para styled-components
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      primaryDark: string;
      secondary: string;
      accent: string;
      success: string;
      successDark: string;
      warning: string;
      warningDark: string;
      error: string;
      errorDark: string;
      info: string;
      background: string;
      surface: string;
      surfaceHover: string;
      border: string;
      text: {
        primary: string;
        secondary: string;
      };
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    typography: {
      fontFamily: {
        primary: string;
        mono: string;
      };
      fontSize: {
        xs: string;
        sm: string;
        base: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
        '4xl': string;
      };
      fontWeight: {
        light: number;
        normal: number;
        medium: number;
        semibold: number;
        bold: number;
      };
      lineHeight: {
        tight: number;
        normal: number;
        relaxed: number;
      };
    };
    borderRadius: {
      none: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      full: string;
    };
    shadows: {
      none: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    breakpoints: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
    zIndex: {
      dropdown: number;
      sticky: number;
      fixed: number;
      modal: number;
      popover: number;
      tooltip: number;
    };
  }
}

// Tema padrão expandido
export const defaultTheme: DefaultTheme = {
  colors: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    secondary: '#64748b',
    accent: '#60a5fa',
    success: '#10b981',
    successDark: '#059669',
    warning: '#f59e0b',
    warningDark: '#d97706',
    error: '#ef4444',
    errorDark: '#dc2626',
    info: '#06b6d4',
    background: '#ffffff',
    surface: '#f8fafc',
    surfaceHover: '#f1f5f9',
    border: '#e2e8f0',
    text: {
      primary: '#1f2937',
      secondary: '#6b7280'
    }
  },
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    xxl: '3rem'      // 48px
  },
  typography: {
    fontFamily: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      mono: "'Fira Code', 'Monaco', 'Consolas', monospace"
    },
    fontSize: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem'   // 36px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px'
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060
  }
};