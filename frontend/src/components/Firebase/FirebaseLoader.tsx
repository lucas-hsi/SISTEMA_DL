import React from 'react';

// Ícones SVG simples para substituir lucide-react
const Loader2 = () => (
  <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
    <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const Database = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" stroke="currentColor" strokeWidth="2"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const Cloud = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const Shield = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Tipos de loading do Firebase
export type FirebaseLoadingType = 'auth' | 'firestore' | 'general' | 'sync';

// Props do componente
interface FirebaseLoaderProps {
  type?: FirebaseLoadingType;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
  className?: string;
}

/**
 * Componente de loading específico para operações Firebase
 * Fornece feedback visual durante operações assíncronas
 */
export const FirebaseLoader: React.FC<FirebaseLoaderProps> = ({
  type = 'general',
  message,
  size = 'md',
  overlay = false,
  className = ''
}) => {
  // Configurações baseadas no tipo
  const getTypeConfig = () => {
    switch (type) {
      case 'auth':
        return {
          icon: Shield,
          defaultMessage: 'Autenticando...',
          color: 'text-blue-500'
        };
      case 'firestore':
        return {
          icon: Database,
          defaultMessage: 'Carregando dados...',
          color: 'text-green-500'
        };
      case 'sync':
        return {
          icon: Cloud,
          defaultMessage: 'Sincronizando...',
          color: 'text-purple-500'
        };
      default:
        return {
          icon: Loader2,
          defaultMessage: 'Carregando...',
          color: 'text-gray-500'
        };
    }
  };

  // Configurações de tamanho
  const getSizeConfig = () => {
    switch (size) {
      case 'sm':
        return {
          iconSize: 16,
          textSize: 'text-sm',
          spacing: 'gap-2',
          padding: 'p-2'
        };
      case 'lg':
        return {
          iconSize: 32,
          textSize: 'text-lg',
          spacing: 'gap-4',
          padding: 'p-6'
        };
      default:
        return {
          iconSize: 24,
          textSize: 'text-base',
          spacing: 'gap-3',
          padding: 'p-4'
        };
    }
  };

  const typeConfig = getTypeConfig();
  const sizeConfig = getSizeConfig();
  const IconComponent = typeConfig.icon;
  const displayMessage = message || typeConfig.defaultMessage;

  const loaderContent = (
    <div className={`firebase-loader ${sizeConfig.spacing} ${sizeConfig.padding} ${className}`}>
      <div className="loader-icon">
        <IconComponent />
      </div>
      
      <div className={`loader-text ${sizeConfig.textSize} ${typeConfig.color}`}>
        {displayMessage}
      </div>
      
      <style>{`
        .firebase-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        
        .loader-icon {
          margin-bottom: 0.5rem;
        }
        
        .loader-text {
          font-weight: 500;
          opacity: 0.8;
        }
        
        .firebase-loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(2px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .firebase-loader-inline {
          min-height: 100px;
          width: 100%;
        }
      `}</style>
    </div>
  );

  if (overlay) {
    return (
      <div className="firebase-loader-overlay">
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="firebase-loader-inline">
      {loaderContent}
    </div>
  );
};

/**
 * Componente de loading para listas/tabelas
 */
export const FirebaseListLoader: React.FC<{
  rows?: number;
  columns?: number;
}> = ({ rows = 3, columns = 4 }) => {
  return (
    <div className="firebase-list-loader">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="loader-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="loader-cell">
              <div className="skeleton-line" />
            </div>
          ))}
        </div>
      ))}
      
      <style>{`
        .firebase-list-loader {
          padding: 1rem;
        }
        
        .loader-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          align-items: center;
        }
        
        .loader-cell {
          flex: 1;
        }
        
        .skeleton-line {
          height: 1rem;
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 4px;
        }
        
        @keyframes skeleton-loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Componente de loading para cards
 */
export const FirebaseCardLoader: React.FC<{
  count?: number;
}> = ({ count = 1 }) => {
  return (
    <div className="firebase-card-loader">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="loader-card">
          <div className="card-header">
            <div className="skeleton-circle" />
            <div className="skeleton-lines">
              <div className="skeleton-line long" />
              <div className="skeleton-line short" />
            </div>
          </div>
          
          <div className="card-body">
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
          
          <div className="card-footer">
            <div className="skeleton-button" />
            <div className="skeleton-button" />
          </div>
        </div>
      ))}
      
      <style>{`
        .firebase-card-loader {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
          padding: 1rem;
        }
        
        .loader-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
          background: white;
        }
        
        .card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .skeleton-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
        }
        
        .skeleton-lines {
          flex: 1;
        }
        
        .skeleton-line {
          height: 1rem;
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }
        
        .skeleton-line.long {
          width: 80%;
        }
        
        .skeleton-line.short {
          width: 60%;
        }
        
        .card-body {
          margin-bottom: 1rem;
        }
        
        .card-footer {
          display: flex;
          gap: 0.5rem;
        }
        
        .skeleton-button {
          height: 2rem;
          width: 80px;
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 4px;
        }
        
        @keyframes skeleton-loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Hook para gerenciar estados de loading
 */
export const useFirebaseLoading = () => {
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  };

  const isLoading = (key: string) => {
    return loadingStates[key] || false;
  };

  const isAnyLoading = () => {
    return Object.values(loadingStates).some(loading => loading);
  };

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    loadingStates
  };
};