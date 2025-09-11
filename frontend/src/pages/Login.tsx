import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import { useFormValidation } from '../hooks/useFormValidation';
import { LoginCredentials, UserRole } from '../types';
import './Login.css';

// Função de validação de email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, error, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [rememberMe, setRememberMe] = useState(false);

  // Redirecionamento após login bem-sucedido
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || getDefaultRoute(user.role);
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  // Obter rota padrão baseada no perfil
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

  // Configuração do formulário
  const {
    values,
    isValid,
    isSubmitting,
    handleSubmit,
    getFieldProps
  } = useFormValidation<LoginCredentials>({
    initialValues: {
      email: '',
      password: ''
    },
    validationRules: {
      email: [
        { required: true, message: 'Email é obrigatório' },
        { 
          custom: (value) => validateEmail(value), 
          message: 'Email deve ter um formato válido' 
        }
      ],
      password: [
        { required: true, message: 'Senha é obrigatória' },
        { minLength: 6, message: 'Senha deve ter pelo menos 6 caracteres' }
      ]
    },
    onSubmit: async (credentials) => {
      try {
        await login(credentials);
      } catch (err) {
        console.error('Erro no login:', err);
      }
    }
  });

  const handleForgotPassword = () => {
    // TODO: Implementar modal de recuperação de senha
    console.log('Recuperar senha para:', values.email);
  };

  const getThemeColors = () => {
    if (user?.role) {
      switch (user.role) {
        case UserRole.GESTOR:
          return { primary: '#3b82f6', secondary: '#1d4ed8' }; // Azul
        case UserRole.VENDEDOR:
          return { primary: '#10b981', secondary: '#059669' }; // Verde
        case UserRole.ANUNCIOS:
          return { primary: '#f59e0b', secondary: '#d97706' }; // Laranja
        default:
          return { primary: '#3b82f6', secondary: '#1d4ed8' };
      }
    }
    return { primary: '#3b82f6', secondary: '#1d4ed8' };
  };

  const themeColors = getThemeColors();

  return (
    <div className="login-page" data-theme={theme}>
      <div className="login-background">
        <div className="login-background__gradient" />
        <div className="login-background__pattern" />
      </div>

      {/* Theme Toggle */}
      <button 
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
      >
        {theme === 'light' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        )}
      </button>

      <div className="login-container">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h1 className="login-logo__text">DL Auto Peças</h1>
          <p className="login-logo__subtitle">Sistema de Gestão Integrada</p>
        </div>

        {/* Login Card */}
        <Card 
          className="login-card"
          variant="elevated"
          padding="lg"
          shadow="xl"
          hover
          style={{
            '--primary-color': themeColors.primary,
            '--secondary-color': themeColors.secondary
          } as React.CSSProperties}
        >
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-form__header">
              <h2 className="login-form__title">Entrar no Sistema</h2>
              <p className="login-form__subtitle">
                Acesse sua conta para continuar
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="login-error" role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="login-form__fields">
              {/* Email Field */}
              <Input
                {...getFieldProps('email')}
                type="email"
                label="Email"
                placeholder="seu@email.com"
                required
                autoComplete="email"
                autoFocus
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                }
              />

              {/* Password Field */}
              <Input
                {...getFieldProps('password')}
                type="password"
                label="Senha"
                placeholder="Digite sua senha"
                required
                autoComplete="current-password"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <circle cx="12" cy="16" r="1" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                }
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="login-form__options">
              <label className="login-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="login-checkbox__checkmark" />
                <span className="login-checkbox__label">Lembrar-me</span>
              </label>

              <button
                type="button"
                className="login-forgot"
                onClick={handleForgotPassword}
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!isValid || isLoading}
              loading={isLoading || isSubmitting}
              className="login-submit"
            >
              {isLoading || isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>

            {/* Additional Info */}
            <div className="login-form__footer">
              <p className="login-help">
                Problemas para acessar? Entre em contato com o suporte.
              </p>
            </div>
          </form>
        </Card>

        {/* Footer */}
        <div className="login-footer">
          <p>&copy; 2024 DL Auto Peças. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Loading Overlay */}
      {(isLoading || isSubmitting) && (
        <div className="login-loading-overlay">
          <Loading variant="spinner" size="lg" text="Autenticando..." />
        </div>
      )}
    </div>
  );
};

export default Login;