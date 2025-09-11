import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import { UserRole } from '../types';
import './TwoFactorAuth.css';

interface TwoFactorAuthState {
  email: string;
  tempToken: string;
}

const TwoFactorAuth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verify2FA, isLoading, error, user } = useAuth();
  const { theme } = useTheme();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Estado passado da tela de login
  const state = location.state as TwoFactorAuthState;

  // Redirecionamento se não há estado válido
  useEffect(() => {
    if (!state?.email || !state?.tempToken) {
      navigate('/login', { replace: true });
    }
  }, [state, navigate]);

  // Redirecionamento após verificação bem-sucedida
  useEffect(() => {
    if (user) {
      const defaultRoute = getDefaultRoute(user.role);
      navigate(defaultRoute, { replace: true });
    }
  }, [user, navigate]);

  // Timer de expiração
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Tempo expirado, redirecionar para login
      navigate('/login', { 
        replace: true,
        state: { message: 'Código expirado. Faça login novamente.' }
      });
    }
  }, [timeLeft, navigate]);

  // Focar no primeiro input ao carregar
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const getDefaultRoute = (role: UserRole): string => {
    switch (role) {
      case UserRole.GESTOR:
        return '/gestor/dashboard';
      case UserRole.VENDEDOR:
        return '/vendedor/dashboard';
      case UserRole.ANUNCIOS:
        return '/anuncios/dashboard';
      default:
        return '/dashboard';
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (index: number, value: string) => {
    // Permitir apenas números
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Apenas o último caractere
    setCode(newCode);

    // Mover para o próximo input se um dígito foi inserido
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Mover para o input anterior se backspace em campo vazio
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    
    for (let i = 0; i < 6; i++) {
      newCode[i] = pastedData[i] || '';
    }
    
    setCode(newCode);
    
    // Focar no próximo input vazio ou no último
    const nextEmptyIndex = newCode.findIndex(digit => !digit);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async () => {
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      return;
    }

    setIsSubmitting(true);
    
    try {
        await verify2FA({
          temp_token: state.tempToken,
          code: fullCode
        });
    } catch (err) {
      console.error('Erro na verificação 2FA:', err);
      // Limpar código em caso de erro
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    // TODO: Implementar reenvio de código
    console.log('Reenviar código para:', state.email);
    setTimeLeft(300); // Resetar timer
  };

  const handleBackToLogin = () => {
    navigate('/login', { replace: true });
  };

  const isCodeComplete = code.every(digit => digit !== '');
  const isExpired = timeLeft <= 0;

  if (!state) {
    return null;
  }

  return (
    <div className="two-factor-page" data-theme={theme}>
      <div className="two-factor-background">
        <div className="two-factor-background__gradient" />
        <div className="two-factor-background__pattern" />
      </div>

      <div className="two-factor-container">
        {/* Header */}
        <div className="two-factor-header">
          <div className="two-factor-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <circle cx="12" cy="16" r="1" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="two-factor-title">Verificação em Duas Etapas</h1>
          <p className="two-factor-subtitle">
            Digite o código de 6 dígitos enviado para seu dispositivo
          </p>
        </div>

        {/* Main Card */}
        <Card 
          className="two-factor-card"
          variant="elevated"
          padding="lg"
          shadow="xl"
        >
          {/* Timer */}
          <div className="two-factor-timer">
            <div className="two-factor-timer__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
            </div>
            <span className={`two-factor-timer__text ${timeLeft <= 60 ? 'two-factor-timer__text--warning' : ''}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="two-factor-error" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Code Input */}
          <div className="two-factor-form">
            <div className="two-factor-inputs" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="two-factor-input"
                  disabled={isLoading || isSubmitting || isExpired}
                  aria-label={`Dígito ${index + 1} do código`}
                />
              ))}
            </div>

            <div className="two-factor-info">
              <p>Enviado para: <strong>{state.email}</strong></p>
            </div>

            {/* Actions */}
            <div className="two-factor-actions">
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                disabled={!isCodeComplete || isLoading || isSubmitting || isExpired}
                loading={isLoading || isSubmitting}
                className="two-factor-submit"
              >
                {isLoading || isSubmitting ? 'Verificando...' : 'Verificar Código'}
              </Button>

              <div className="two-factor-secondary-actions">
                <button
                  type="button"
                  className="two-factor-resend"
                  onClick={handleResendCode}
                  disabled={timeLeft > 240} // Permitir reenvio apenas nos últimos 60 segundos
                >
                  Reenviar código
                </button>

                <button
                  type="button"
                  className="two-factor-back"
                  onClick={handleBackToLogin}
                >
                  Voltar ao login
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Help */}
        <div className="two-factor-help">
          <p>
            Não recebeu o código? Verifique sua caixa de spam ou entre em contato com o suporte.
          </p>
        </div>
      </div>

      {/* Loading Overlay */}
      {(isLoading || isSubmitting) && (
        <div className="two-factor-loading-overlay">
          <Loading variant="spinner" size="lg" text="Verificando código..." />
        </div>
      )}
    </div>
  );
};

export default TwoFactorAuth;