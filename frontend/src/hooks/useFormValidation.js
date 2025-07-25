import { useState, useCallback, useEffect } from 'react';

const useFormValidation = (initialValues, validationRules, options = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const { validateOnChange = true, validateOnBlur = true } = options;

  // Validation functions
  const validators = {
    required: (value, message = 'This field is required') => {
      if (!value || (typeof value === 'string' && !value.trim())) {
        return message;
      }
      return null;
    },

    email: (value, message = 'Please enter a valid email address') => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return message;
      }
      return null;
    },

    minLength: (min, message) => (value) => {
      if (value && value.length < min) {
        return message || `Must be at least ${min} characters`;
      }
      return null;
    },

    maxLength: (max, message) => (value) => {
      if (value && value.length > max) {
        return message || `Must be no more than ${max} characters`;
      }
      return null;
    },

    pattern: (regex, message = 'Invalid format') => (value) => {
      if (value && !regex.test(value)) {
        return message;
      }
      return null;
    },

    phone: (value, message = 'Please enter a valid phone number') => {
      if (value && !/^[\d\s\-\+\(\)]+$/.test(value)) {
        return message;
      }
      return null;
    },

    positiveNumber: (value, message = 'Must be a positive number') => {
      if (value !== '' && value !== null && value !== undefined) {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
          return message;
        }
      }
      return null;
    },

    integer: (value, message = 'Must be a whole number') => {
      if (value !== '' && value !== null && value !== undefined) {
        const num = parseInt(value);
        if (isNaN(num) || num.toString() !== value.toString()) {
          return message;
        }
      }
      return null;
    },

    custom: (validatorFn, message) => (value) => {
      if (!validatorFn(value)) {
        return message;
      }
      return null;
    }
  };

  // Validate a single field
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;

    for (const rule of rules) {
      let validator;
      let error;

      if (typeof rule === 'function') {
        error = rule(value);
      } else if (typeof rule === 'string') {
        validator = validators[rule];
        if (validator) {
          error = validator(value);
        }
      } else if (typeof rule === 'object') {
        const { type, ...params } = rule;
        validator = validators[type];
        if (validator) {
          if (type === 'minLength' || type === 'maxLength') {
            error = validator(params.value, params.message)(value);
          } else if (type === 'pattern') {
            error = validator(params.regex, params.message)(value);
          } else if (type === 'custom') {
            error = validator(params.validator, params.message)(value);
          } else {
            error = validator(value, params.message);
          }
        }
      }

      if (error) {
        return error;
      }
    }

    return null;
  }, [validationRules]);

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {};
    let formIsValid = true;

    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        formIsValid = false;
      }
    });

    setErrors(newErrors);
    setIsValid(formIsValid);
    return formIsValid;
  }, [values, validateField, validationRules]);

  // Handle input change
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));

    if (validateOnChange && touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [validateField, validateOnChange, touched]);

  // Handle input blur
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));

    if (validateOnBlur) {
      const error = validateField(name, values[name]);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [validateField, validateOnBlur, values]);

  // Handle form submission
  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const allTouched = Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Validate form
    const formIsValid = validateForm();
    
    if (formIsValid && onSubmit) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
        throw error;
      }
    }
    
    setIsSubmitting(false);
    return formIsValid;
  }, [values, validateForm, validationRules]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsValid(false);
  }, [initialValues]);

  // Set field value
  const setFieldValue = useCallback((name, value) => {
    handleChange(name, value);
  }, [handleChange]);

  // Set field error
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  // Check if form has been modified
  const isDirty = Object.keys(values).some(key => values[key] !== initialValues[key]);

  // Effect to validate form when values change
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      validateForm();
    }
  }, [values, touched, validateForm]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    validateForm,
    validateField
  };
};

export default useFormValidation;