'use client';

import React from 'react';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  colorScheme: 'gestor' | 'vendedor' | 'anuncios';
  className?: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ 
  title, 
  subtitle, 
  colorScheme, 
  className = '' 
}) => {
  // Definir gradientes baseados no perfil
  const getGradientClasses = () => {
    switch (colorScheme) {
      case 'gestor':
        return 'bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-800';
      case 'vendedor':
        return 'bg-gradient-to-r from-green-500 to-green-700 dark:from-green-600 dark:to-green-800';
      case 'anuncios':
        return 'bg-gradient-to-r from-orange-500 to-orange-700 dark:from-orange-600 dark:to-orange-800';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-800';
    }
  };

  // Definir ícones/elementos decorativos baseados no perfil
  const getDecorationClasses = () => {
    switch (colorScheme) {
      case 'gestor':
        return 'shadow-blue-500/25';
      case 'vendedor':
        return 'shadow-green-500/25';
      case 'anuncios':
        return 'shadow-orange-500/25';
      default:
        return 'shadow-blue-500/25';
    }
  };

  return (
    <div className={`rounded-xl shadow-lg ${getGradientClasses()} ${getDecorationClasses()} p-6 mb-6 relative overflow-hidden ${className}`}>
      {/* Elemento decorativo de fundo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
      
      {/* Conteúdo */}
      <div className="relative z-10">
        <h1 className="text-3xl font-bold text-white mb-2">
          {title}
        </h1>
        
        {subtitle && (
          <p className="text-white/90 text-lg font-medium">
            {subtitle}
          </p>
        )}
        
        {/* Indicador visual do perfil */}
        <div className="mt-4 flex items-center">
          <div className="w-2 h-2 bg-white/60 rounded-full mr-2"></div>
          <span className="text-white/80 text-sm font-medium capitalize">
            Painel {colorScheme === 'anuncios' ? 'de Anúncios' : colorScheme}
          </span>
        </div>
      </div>
      
      {/* Brilho sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
    </div>
  );
};

export default PageTitle;