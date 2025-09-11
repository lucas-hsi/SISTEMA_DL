import { useState, useCallback, useMemo } from 'react';
import { ValidationRule } from '../types';

interface UseFormValidationProps<T> {
  initialValues: T;
  validationRules: Record<keyof T, ValidationRule[]>;
  onSubmit?: (values: T) => void | Promise<void>;
}



export const useFormValidation = <T extends Record<string, any>>({
  initialValues,
  validationRules,
  onSubmit
}: UseFormValidationProps<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validar um campo específico
  const validateField = useCallback((fieldName: keyof T, value: any): string => {
    const rules = validationRules[fieldName] || [];
    
    for (const rule of rules) {
      if (rule.required && (!value || value.toString().trim() === '')) {
        return rule.message || `${String(fieldName)} é obrigatório`;
      }
      
      if (value && rule.minLength && value.toString().length < rule.minLength) {
        return rule.message || `${String(fieldName)} deve ter pelo menos ${rule.minLength} caracteres`;
      }
      
      if (value && rule.maxLength && value.toString().length > rule.maxLength) {
        return rule.message || `${String(fieldName)} deve ter no máximo ${rule.maxLength} caracteres`;
      }
      
      if (value && rule.pattern && !rule.pattern.test(value.toString())) {
        return rule.message || `${String(fieldName)} tem formato inválido`;
      }
      
      if (rule.custom && !rule.custom(value, values)) {
        return rule.message || `${String(fieldName)} é inválido`;
      }
    }
    
    return '';
  }, [validationRules, values]);

  // Validar todos os campos
  const validateAll = useCallback((): boolean => {
    const newErrors: Record<keyof T, string> = {} as Record<keyof T, string>;
    let hasErrors = false;

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(fieldName as keyof T, values[fieldName as keyof T]);
      if (error) {
        newErrors[fieldName as keyof T] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  }, [validateField, validationRules, values]);

  // Atualizar valor de um campo
  const setValue = useCallback((fieldName: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    // Validar em tempo real se o campo já foi tocado
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  }, [validateField, touched]);

  // Marcar campo como tocado
  const setFieldTouched = useCallback((fieldName: keyof T, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [fieldName]: isTouched }));
    
    if (isTouched) {
      const error = validateField(fieldName, values[fieldName]);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  }, [validateField, values]);

  // Resetar formulário
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({} as Record<keyof T, string>);
    setTouched({} as Record<keyof T, boolean>);
    setIsSubmitting(false);
  }, [initialValues]);

  // Submeter formulário
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Marcar todos os campos como tocados
    const allTouched = Object.keys(validationRules).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Record<keyof T, boolean>);
    setTouched(allTouched);

    if (!validateAll()) {
      return;
    }

    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Erro ao submeter formulário:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [validateAll, onSubmit, values, validationRules]);

  // Verificar se o formulário é válido
  const isValid = useMemo(() => {
    return Object.keys(validationRules).every(fieldName => {
      const error = validateField(fieldName as keyof T, values[fieldName as keyof T]);
      return !error;
    });
  }, [validateField, validationRules, values]);

  // Verificar se há campos tocados com erro
  const hasErrors = useMemo(() => {
    return Object.values(errors).some(error => error !== '');
  }, [errors]);

  // Obter props para um campo específico
  const getFieldProps = useCallback((fieldName: keyof T) => {
    return {
      value: values[fieldName] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(fieldName, e.target.value);
      },
      onBlur: () => {
        setFieldTouched(fieldName, true);
      },
      error: touched[fieldName] ? errors[fieldName] : '',
      name: String(fieldName),
      id: String(fieldName)
    };
  }, [values, setValue, setFieldTouched, touched, errors]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    hasErrors,
    setValue,
    setFieldTouched,
    validateField,
    validateAll,
    reset,
    handleSubmit,
    getFieldProps
  };
};

// Hook para validação de email
export const useEmailValidation = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return useCallback((email: string): boolean => {
    return emailRegex.test(email);
  }, []);
};

// Hook para validação de senha
export const usePasswordValidation = () => {
  return useCallback((password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers,
      checks: {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  }, []);
};