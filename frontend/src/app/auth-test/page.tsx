'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAuthError } from '@/context/AuthErrorContext';
import { useAuthNotifications } from '@/hooks/useAuthNotifications';
import { useAuthRecovery } from '@/hooks/useAuthRecovery';
import { useFormPreservation } from '@/hooks/useFormPreservation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Shield, AlertTriangle, CheckCircle, Clock, Wifi } from 'lucide-react';

const AuthTestPage: React.FC = () => {
  const {
    user,
    isAuthenticated,
    refreshToken
  } = useAuth();
  
  const {
    currentError,
    isReauthModalOpen,
    isRecovering,
    reportAuthError,
    openReauthModal,
    getErrorStats
  } = useAuthError();
  
  const {
    notifications,
    hasActiveNotifications,
    showTokenRefreshSuccess,
    showTokenRefreshWarning,
    showTokenExpiredError,
    showNetworkError,
    showReauthRequired,
    clearAllNotifications
  } = useAuthNotifications();
  
  const {
    isRecovering: isAutoRecovering,
    recoveryAttempts,
    canRetry,
    startRecovery,
    recoverFromTokenExpiry,
    recoverFromNetworkError,
    resetRecoveryState
  } = useAuthRecovery();
  
  const {
    preserveFormData,
    restoreData,
    hasPreservedData,
    clearPreservedData,
    getPreservedInfo,
    preservedData
  } = useFormPreservation();
  
  // Estados locais para teste
  const [testFormData, setTestFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const [testResults, setTestResults] = useState<string[]>([]);
  
  // Função para adicionar resultado de teste
  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${result}`]);
  };
  
  // Função para testar renovação manual
  const testManualRefresh = async () => {
    try {
      addTestResult('Iniciando renovação manual...');
      const success = await refreshToken();
      addTestResult(success ? '✅ Renovação manual bem-sucedida' : '❌ Renovação manual falhou');
    } catch (error) {
      addTestResult(`❌ Erro na renovação manual: ${error}`);
    }
  };
  
  // Função para testar renovação de token
  const testTokenRefresh = async () => {
    try {
      addTestResult('Testando renovação de token...');
      const success = await refreshToken();
      addTestResult(success ? '✅ Token renovado com sucesso' : '❌ Falha na renovação');
    } catch (error) {
      addTestResult(`❌ Erro na renovação: ${error}`);
    }
  };
  
  // Função para simular erro de token expirado
  const simulateTokenExpired = () => {
    addTestResult('Simulando token expirado...');
    reportAuthError('token_expired', 'Token simulado como expirado para teste');
  };
  
  // Função para simular erro de rede
  const simulateNetworkError = () => {
    addTestResult('Simulando erro de rede...');
    reportAuthError('network_error', 'Erro de rede simulado para teste');
  };
  
  // Função para testar preservação de formulário
  const testFormPreservation = () => {
    addTestResult('Preservando dados do formulário...');
    preserveFormData(testFormData);
    addTestResult('✅ Dados preservados com sucesso');
  };
  
  // Função para testar restauração de dados
  const testDataRestoration = async () => {
    try {
      addTestResult('Restaurando dados preservados...');
      const { formData, url } = await restoreData();
      if (formData) {
        setTestFormData(formData as typeof testFormData);
        addTestResult('✅ Dados restaurados com sucesso');
      } else {
        addTestResult('⚠️ Nenhum dado preservado encontrado');
      }
    } catch (error) {
      addTestResult(`❌ Erro na restauração: ${error}`);
    }
  };
  
  // Função para testar recuperação automática
  const testAutoRecovery = async () => {
    addTestResult('Iniciando recuperação automática...');
    const success = await startRecovery();
    addTestResult(success ? '✅ Recuperação automática bem-sucedida' : '❌ Recuperação automática falhou');
  };
  
  // Estatísticas de erro
  const errorStats = getErrorStats();
  const preservedInfo = getPreservedInfo();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Sistema de Autenticação Robusto</h1>
        <p className="text-muted-foreground">Teste e demonstração das funcionalidades implementadas</p>
      </div>
      
      {/* Status Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Status de Autenticação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Estado:</span>
                <Badge variant={isAuthenticated ? 'default' : 'destructive'}>
                  {isAuthenticated ? 'Autenticado' : 'Não Autenticado'}
                </Badge>
              </div>

            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Status de Erros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Erro Atual:</span>
                <Badge variant={currentError ? 'destructive' : 'default'}>
                  {currentError ? currentError.type : 'Nenhum'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Modal Aberto:</span>
                <Badge variant={isReauthModalOpen ? 'secondary' : 'outline'}>
                  {isReauthModalOpen ? 'Sim' : 'Não'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Total de Erros:</span>
                <span className="text-sm">{errorStats.totalErrors}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Status de Recuperação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Recuperando:</span>
                <Badge variant={isAutoRecovering ? 'secondary' : 'outline'}>
                  {isAutoRecovering ? 'Sim' : 'Não'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Tentativas:</span>
                <span className="text-sm">{recoveryAttempts}</span>
              </div>
              <div className="flex justify-between">
                <span>Pode Tentar:</span>
                <Badge variant={canRetry ? 'default' : 'destructive'}>
                  {canRetry ? 'Sim' : 'Não'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Formulário de Teste */}
      <Card>
        <CardHeader>
          <CardTitle>Formulário de Teste</CardTitle>
          <CardDescription>
            Use este formulário para testar a preservação de dados durante reautenticação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Nome"
              value={testFormData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestFormData(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="Email"
              type="email"
              value={testFormData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestFormData(prev => ({ ...prev, email: e.target.value }))}
            />
            <Input
              placeholder="Mensagem"
              value={testFormData.message}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestFormData(prev => ({ ...prev, message: e.target.value }))}
            />
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={testFormPreservation} size="sm">
              Preservar Dados
            </Button>
            <Button onClick={testDataRestoration} size="sm" variant="outline">
              Restaurar Dados
            </Button>
            <Button 
              onClick={clearPreservedData} 
              size="sm" 
              variant="destructive"
              disabled={!hasPreservedData()}
            >
              Limpar Dados
            </Button>
          </div>
          
          {preservedInfo && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Dados Preservados:</strong> {preservedData ? new Date(preservedData.timestamp).toLocaleString() : 'N/A'}
              </p>
              {preservedInfo.url && (
                <p className="text-sm">
                  <strong>URL:</strong> {preservedInfo.url}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Controles de Teste */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Testes de Token</CardTitle>
            <CardDescription>Teste as funcionalidades de renovação de token</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button onClick={testManualRefresh} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Renovar Token Manualmente
              </Button>
              
              <Button onClick={testTokenRefresh} className="w-full" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Testar Renovação
              </Button>
              
              <Button onClick={simulateTokenExpired} className="w-full" variant="destructive">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Simular Token Expirado
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Testes de Recuperação</CardTitle>
            <CardDescription>Teste as funcionalidades de recuperação de erros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button onClick={testAutoRecovery} className="w-full" disabled={isAutoRecovering}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isAutoRecovering ? 'animate-spin' : ''}`} />
                Recuperação Automática
              </Button>
              
              <Button onClick={simulateNetworkError} className="w-full" variant="outline">
                <Wifi className="w-4 h-4 mr-2" />
                Simular Erro de Rede
              </Button>
              
              <Button 
                onClick={() => openReauthModal(true)} 
                className="w-full" 
                variant="secondary"
              >
                <Shield className="w-4 h-4 mr-2" />
                Abrir Modal de Reauth
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Testes de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle>Testes de Notificação</CardTitle>
          <CardDescription>Teste o sistema de notificações discretas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button onClick={showTokenRefreshSuccess} size="sm" variant="outline">
              <CheckCircle className="w-4 h-4 mr-1" />
              Sucesso
            </Button>
            <Button onClick={() => showTokenRefreshWarning(300000)} size="sm" variant="outline">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Aviso
            </Button>
            <Button onClick={showTokenExpiredError} size="sm" variant="outline">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Erro
            </Button>
            <Button onClick={clearAllNotifications} size="sm" variant="destructive">
              Limpar Todas
            </Button>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Notificações Ativas: {notifications.length} | 
              Tem Notificações: {hasActiveNotifications ? 'Sim' : 'Não'}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Log de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Log de Testes</CardTitle>
          <CardDescription>Resultados dos testes executados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum teste executado ainda</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono p-2 bg-muted rounded">
                  {result}
                </div>
              ))
            )}
          </div>
          
          {testResults.length > 0 && (
            <Button 
              onClick={() => setTestResults([])} 
              size="sm" 
              variant="outline" 
              className="mt-3"
            >
              Limpar Log
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthTestPage;