import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Props do Error Boundary
interface FirebaseErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// State do Error Boundary
interface FirebaseErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary específico para erros do Firebase
 * Captura e trata erros relacionados ao Firebase de forma elegante
 */
export class FirebaseErrorBoundary extends Component<
  FirebaseErrorBoundaryProps,
  FirebaseErrorBoundaryState
> {
  constructor(props: FirebaseErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<FirebaseErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log do erro
    console.error('Firebase Error Boundary capturou um erro:', error, errorInfo);

    // Callback personalizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão
      return (
        <div className="firebase-error-boundary">
          <div className="error-container">
            <div className="error-icon">
              <AlertCircle size={48} className="text-red-500" />
            </div>
            
            <div className="error-content">
              <h2 className="error-title">
                Erro no Firebase
              </h2>
              
              <p className="error-message">
                {this.getErrorMessage(this.state.error)}
              </p>
              
              <div className="error-actions">
                <button
                  onClick={this.handleRetry}
                  className="retry-button"
                >
                  <RefreshCw size={16} />
                  Tentar Novamente
                </button>
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="error-details">
                  <summary>Detalhes do Erro (Desenvolvimento)</summary>
                  <pre className="error-stack">
                    {this.state.error?.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="error-info">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}
            </div>
          </div>
          
          <style>{`
            .firebase-error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 400px;
              padding: 2rem;
              background: #fef2f2;
              border-radius: 8px;
              border: 1px solid #fecaca;
            }
            
            .error-container {
              text-align: center;
              max-width: 500px;
            }
            
            .error-icon {
              margin-bottom: 1rem;
            }
            
            .error-title {
              font-size: 1.5rem;
              font-weight: 600;
              color: #dc2626;
              margin-bottom: 0.5rem;
            }
            
            .error-message {
              color: #7f1d1d;
              margin-bottom: 1.5rem;
              line-height: 1.5;
            }
            
            .error-actions {
              margin-bottom: 1rem;
            }
            
            .retry-button {
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.75rem 1.5rem;
              background: #dc2626;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              transition: background-color 0.2s;
            }
            
            .retry-button:hover {
              background: #b91c1c;
            }
            
            .error-details {
              text-align: left;
              margin-top: 1rem;
              padding: 1rem;
              background: #fee2e2;
              border-radius: 4px;
              border: 1px solid #fecaca;
            }
            
            .error-details summary {
              cursor: pointer;
              font-weight: 500;
              color: #991b1b;
              margin-bottom: 0.5rem;
            }
            
            .error-stack,
            .error-info {
              font-size: 0.75rem;
              color: #7f1d1d;
              background: #fef2f2;
              padding: 0.5rem;
              border-radius: 4px;
              overflow-x: auto;
              margin: 0.5rem 0;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }

  private getErrorMessage(error: Error | null): string {
    if (!error) return 'Erro desconhecido';

    // Mensagens específicas para erros do Firebase
    const firebaseErrors: { [key: string]: string } = {
      'Firebase: Error (auth/network-request-failed)': 'Erro de conexão. Verifique sua internet.',
      'Firebase: Error (auth/too-many-requests)': 'Muitas tentativas. Tente novamente mais tarde.',
      'Firebase: Error (firestore/permission-denied)': 'Permissão negada. Verifique suas credenciais.',
      'Firebase: Error (firestore/unavailable)': 'Serviço temporariamente indisponível.',
      'Firebase: Error (auth/user-not-found)': 'Usuário não encontrado.',
      'Firebase: Error (auth/wrong-password)': 'Senha incorreta.',
      'Firebase: Error (auth/invalid-email)': 'Email inválido.'
    };

    // Verificar se é um erro conhecido do Firebase
    for (const [pattern, message] of Object.entries(firebaseErrors)) {
      if (error.message.includes(pattern) || error.message.includes(pattern.replace('Firebase: Error ', ''))) {
        return message;
      }
    }

    // Mensagem genérica para outros erros
    return error.message || 'Ocorreu um erro inesperado. Tente novamente.';
  }
}

/**
 * Hook para usar o Error Boundary programaticamente
 */
export const useFirebaseErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`Erro Firebase${context ? ` em ${context}` : ''}:`, error);
    
    // Aqui você pode adicionar lógica adicional como:
    // - Enviar erro para serviço de monitoramento
    // - Mostrar notificação toast
    // - Redirecionar usuário
  };

  return { handleError };
};