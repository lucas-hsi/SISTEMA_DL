'use client';

import { useState, useCallback } from 'react';
import { generateAd } from '@/lib/api';

interface GenerateAdRequest {
  product_id: number;
  marketplace: string;
  strategy?: string;
  additional_info?: string;
}

interface GeneratedAdContent {
  title: string;
  subtitle?: string;
  description: string;
  bullet_points: string[];
  category_path: string;
  price_strategy: string;
  price_value?: number;
  marketplace: string;
  reasoning?: string;
  suggestions?: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

interface UseAdGenerationReturn {
  generatedContent: GeneratedAdContent | null;
  isGenerating: boolean;
  generationError: string | null;
  validationResult: ValidationResult | null;
  isValidating: boolean;
  generateContent: (request: GenerateAdRequest) => Promise<GeneratedAdContent | null>;
  previewAd: (content: GeneratedAdContent) => string;
  validateGeneration: (content: GeneratedAdContent) => Promise<ValidationResult>;
  clearGeneration: () => void;
  applyGeneration: (content: GeneratedAdContent) => void;
}

export const useAdGeneration = (): UseAdGenerationReturn => {
  const [generatedContent, setGeneratedContent] = useState<GeneratedAdContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const generateContent = useCallback(async (request: GenerateAdRequest): Promise<GeneratedAdContent | null> => {
    setIsGenerating(true);
    setGenerationError(null);
    setValidationResult(null);
    
    try {
      const response = await generateAd(request);
      
      // Normalizar resposta da API
      const normalizedContent: GeneratedAdContent = {
        title: response.title || '',
        subtitle: response.subtitle || '',
        description: response.description || '',
        bullet_points: response.bullet_points || [],
        category_path: response.category_path || '',
        price_strategy: response.price_strategy || 'competitive',
        price_value: response.price_value,
        marketplace: response.marketplace || request.marketplace,
        reasoning: response.reasoning || '',
        suggestions: response.suggestions || []
      };
      
      setGeneratedContent(normalizedContent);
      return normalizedContent;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Erro ao gerar conteúdo do anúncio';
      setGenerationError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const previewAd = useCallback((content: GeneratedAdContent): string => {
    if (!content) return '';
    
    // Gerar preview baseado no marketplace
    switch (content.marketplace.toLowerCase()) {
      case 'mercadolivre':
      case 'mercado_livre':
        return `
**${content.title}**
${content.subtitle ? `\n*${content.subtitle}*\n` : ''}
${content.description}

**Características:**
${content.bullet_points.map(point => `• ${point}`).join('\n')}

**Categoria:** ${content.category_path}
**Estratégia de Preço:** ${content.price_strategy}
${content.price_value ? `**Preço Sugerido:** R$ ${content.price_value.toFixed(2)}` : ''}
        `.trim();
        
      case 'shopee':
        return `
🔥 ${content.title} 🔥
${content.subtitle ? `\n✨ ${content.subtitle} ✨\n` : ''}
📝 ${content.description}

🎯 **Destaques:**
${content.bullet_points.map(point => `✅ ${point}`).join('\n')}

📂 ${content.category_path}
💰 ${content.price_strategy}
${content.price_value ? `💵 R$ ${content.price_value.toFixed(2)}` : ''}
        `.trim();
        
      case 'amazon':
        return `
${content.title}
${content.subtitle ? `\n${content.subtitle}\n` : ''}
${content.description}

Feature Highlights:
${content.bullet_points.map(point => `• ${point}`).join('\n')}

Category: ${content.category_path}
Pricing Strategy: ${content.price_strategy}
${content.price_value ? `Suggested Price: $${content.price_value.toFixed(2)}` : ''}
        `.trim();
        
      default:
        return `
${content.title}
${content.subtitle ? `\n${content.subtitle}\n` : ''}
${content.description}

${content.bullet_points.map(point => `• ${point}`).join('\n')}

Categoria: ${content.category_path}
Estratégia: ${content.price_strategy}
${content.price_value ? `Preço: R$ ${content.price_value.toFixed(2)}` : ''}
        `.trim();
    }
  }, []);

  const validateGeneration = useCallback(async (content: GeneratedAdContent): Promise<ValidationResult> => {
    setIsValidating(true);
    
    try {
      const errors: string[] = [];
      const warnings: string[] = [];
      let score = 100;
      
      // Validações básicas
      if (!content.title || content.title.length < 10) {
        errors.push('Título deve ter pelo menos 10 caracteres');
        score -= 20;
      }
      
      if (content.title && content.title.length > 60) {
        warnings.push('Título muito longo (recomendado até 60 caracteres)');
        score -= 5;
      }
      
      if (!content.description || content.description.length < 50) {
        errors.push('Descrição deve ter pelo menos 50 caracteres');
        score -= 15;
      }
      
      if (content.bullet_points.length < 3) {
        warnings.push('Recomendado pelo menos 3 características destacadas');
        score -= 10;
      }
      
      if (!content.category_path) {
        errors.push('Caminho da categoria é obrigatório');
        score -= 15;
      }
      
      // Validações específicas por marketplace
      switch (content.marketplace.toLowerCase()) {
        case 'mercadolivre':
        case 'mercado_livre':
          if (content.title && content.title.length > 60) {
            errors.push('Título do MercadoLivre deve ter até 60 caracteres');
            score -= 15;
          }
          break;
          
        case 'amazon':
          if (content.bullet_points.length > 5) {
            warnings.push('Amazon recomenda até 5 bullet points');
            score -= 5;
          }
          break;
      }
      
      // Validação de preço
      if (content.price_value && content.price_value <= 0) {
        errors.push('Preço deve ser maior que zero');
        score -= 10;
      }
      
      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        score: Math.max(0, score)
      };
      
      setValidationResult(result);
      return result;
    } catch (err: any) {
      const result: ValidationResult = {
        isValid: false,
        errors: ['Erro durante validação'],
        warnings: [],
        score: 0
      };
      
      setValidationResult(result);
      return result;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearGeneration = useCallback(() => {
    setGeneratedContent(null);
    setGenerationError(null);
    setValidationResult(null);
  }, []);

  const applyGeneration = useCallback((content: GeneratedAdContent) => {
    setGeneratedContent(content);
    setGenerationError(null);
  }, []);

  return {
    generatedContent,
    isGenerating,
    generationError,
    validationResult,
    isValidating,
    generateContent,
    previewAd,
    validateGeneration,
    clearGeneration,
    applyGeneration
  };
};

export default useAdGeneration;