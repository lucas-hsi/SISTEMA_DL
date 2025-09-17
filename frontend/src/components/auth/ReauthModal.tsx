'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { X, AlertTriangle, RefreshCw } from 'lucide-react';

interface ReauthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preserveUrl?: string;
  formData?: Record<string, unknown>;
}

const ReauthModal: React.FC<ReauthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preserveUrl,
  formData
}) => {
  const { login, refreshToken } = useAuth();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  // Reset estado quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setCredentials({ email: '', password: '' });
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Bloquear após 3 tentativas
  useEffect(() => {
    if (attempts >= 3) {
      setIsBlocked(true);
      setTimeout(() => {
        setIsBlocked(false);
        setAttempts(0);
      }, 300000); // 5 minutos
    }
  }, [attempts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      setError('Muitas tentativas. Aguarde 5 minutos.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await login(credentials);
      
      // Restaurar dados do formulário se existirem
      if (formData) {
        sessionStorage.setItem('preserved_form_data', JSON.stringify(formData));
      }
      
      // Restaurar URL se especificada
      if (preserveUrl) {
        sessionStorage.setItem('preserved_url', preserveUrl);
      }
      
      console.log('✅ Reautenticação bem-sucedida');
      onSuccess();
      onClose();
      
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { detail?: string } } };
      console.error('❌ Erro na reautenticação:', error);
      setAttempts(prev => prev + 1);
      
      if (axiosError.response?.status === 401) {
        setError('Email ou senha incorretos');
      } else if (axiosError.response?.status === 429) {
        setError('Muitas tentativas. Tente novamente em alguns minutos.');
        setIsBlocked(true);
      } else {
        setError('Erro de conexão. Verifique sua internet.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryRefresh = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await refreshToken();
      
      if (success) {
        console.log('✅ Renovação manual bem-sucedida');
        onSuccess();
        onClose();
      } else {
        setError('Falha na renovação. Faça login novamente.');
      }
    } catch (error) {
      console.error('❌ Erro na renovação manual:', error);
      setError('Falha na renovação. Faça login novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Sessão Expirada
              </h3>
              <p className="text-sm text-gray-600">
                Sua sessão expirou. Faça login novamente.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informações preservadas */}
        {(preserveUrl || formData) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Não se preocupe!</strong> Seus dados serão preservados após o login.
            </p>
            {preserveUrl && (
              <p className="text-xs text-blue-600 mt-1">
                Você será redirecionado para: {preserveUrl}
              </p>
            )}
          </div>
        )}

        {/* Opção de renovação */}
        {!isBlocked && (
          <div className="mb-4">
            <button
              onClick={handleRetryRefresh}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>
                {isLoading ? 'Renovando...' : 'Tentar Renovar Token'}
              </span>
            </button>
            
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-sm text-gray-500">ou</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
          </div>
        )}

        {/* Formulário de login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="seu@email.com"
              required
              disabled={isLoading || isBlocked}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
              disabled={isLoading || isBlocked}
            />
          </div>

          {/* Erro */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
              {attempts > 0 && attempts < 3 && (
                <p className="text-xs text-red-600 mt-1">
                  Tentativa {attempts}/3
                </p>
              )}
            </div>
          )}

          {/* Botões */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || isBlocked || !credentials.email || !credentials.password}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Entrando...' : isBlocked ? 'Bloqueado' : 'Entrar'}
            </button>
          </div>
        </form>

        {/* Informações de bloqueio */}
        {isBlocked && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Conta temporariamente bloqueada</strong>
            </p>
            <p className="text-xs text-red-600 mt-1">
              Aguarde 5 minutos antes de tentar novamente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReauthModal;