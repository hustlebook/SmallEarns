import { useState } from 'react';

/**
 * Custom hook for form validation with standardized error handling
 * @returns Object with validation state and functions
 */
export function useFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateRequired = (value: string, fieldName: string): boolean => {
    if (!value.trim()) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: `${fieldName} is required. Please fill this in!`
      }));
      return false;
    }
    // Clear error if validation passes
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    return true;
  };

  const validateMinLength = (value: string, minLength: number, fieldName: string): boolean => {
    if (value.trim().length < minLength) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: `${fieldName} must be at least ${minLength} characters long. A little more detail, please!`
      }));
      return false;
    }
    // Clear error if validation passes
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    return true;
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(\+?1-?)?\d{10,15}$/;
    if (phone && !phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
      setErrors(prev => ({
        ...prev,
        phone: 'Please enter a valid phone number (10-15 digits, optional +). Double-check those digits!'
      }));
      return false;
    }
    // Clear error if validation passes
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.phone;
      return newErrors;
    });
    return true;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setErrors(prev => ({
        ...prev,
        email: 'Please enter a valid email address. Check for typos!'
      }));
      return false;
    }
    // Clear error if validation passes
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.email;
      return newErrors;
    });
    return true;
  };

  const validateNumber = (value: string, fieldName: string, min?: number, max?: number): boolean => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: `${fieldName} must be a valid number. Please enter numbers only!`
      }));
      return false;
    }
    
    if (min !== undefined && numValue < min) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: `${fieldName} must be at least ${min}. Please increase the value!`
      }));
      return false;
    }
    
    if (max !== undefined && numValue > max) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: `${fieldName} must not exceed ${max}. Please reduce the value!`
      }));
      return false;
    }
    
    // Clear error if validation passes
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    return true;
  };

  const clearErrors = () => {
    setErrors({});
  };

  const clearError = (fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    validateRequired,
    validateMinLength,
    validatePhone,
    validateEmail,
    validateNumber,
    clearErrors,
    clearError,
    hasErrors,
  };
}