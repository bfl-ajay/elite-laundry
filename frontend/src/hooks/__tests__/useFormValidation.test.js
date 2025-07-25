import { renderHook, act } from '@testing-library/react';
import useFormValidation from '../useFormValidation';

describe('useFormValidation', () => {
  const initialValues = {
    name: '',
    email: '',
    age: ''
  };

  const validationRules = {
    name: [
      'required',
      { type: 'minLength', value: 2, message: 'Name must be at least 2 characters' }
    ],
    email: [
      'required',
      'email'
    ],
    age: [
      'required',
      'positiveNumber'
    ]
  };

  test('initializes with correct default values', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isValid).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  test('handles field changes correctly', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      result.current.handleChange('name', 'John');
    });

    expect(result.current.values.name).toBe('John');
    expect(result.current.isDirty).toBe(true);
  });

  test('validates required fields', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      result.current.handleBlur('name');
    });

    expect(result.current.errors.name).toBe('This field is required');
    expect(result.current.touched.name).toBe(true);
  });

  test('validates email format', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      result.current.handleChange('email', 'invalid-email');
      result.current.handleBlur('email');
    });

    expect(result.current.errors.email).toBe('Please enter a valid email address');
  });

  test('validates minimum length', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      result.current.handleChange('name', 'A');
      result.current.handleBlur('name');
    });

    expect(result.current.errors.name).toBe('Name must be at least 2 characters');
  });

  test('validates positive numbers', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      result.current.handleChange('age', '-5');
      result.current.handleBlur('age');
    });

    expect(result.current.errors.age).toBe('Must be a positive number');
  });

  test('form is valid when all fields pass validation', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      result.current.handleChange('name', 'John Doe');
      result.current.handleChange('email', 'john@example.com');
      result.current.handleChange('age', '25');
      result.current.validateForm();
    });

    expect(result.current.isValid).toBe(true);
    expect(Object.keys(result.current.errors)).toHaveLength(0);
  });

  test('resets form correctly', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      result.current.handleChange('name', 'John');
      result.current.handleBlur('name');
      result.current.resetForm();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isDirty).toBe(false);
  });

  test('handles form submission', async () => {
    const mockSubmit = jest.fn().mockResolvedValue();
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    // Fill form with valid data
    act(() => {
      result.current.handleChange('name', 'John Doe');
      result.current.handleChange('email', 'john@example.com');
      result.current.handleChange('age', '25');
    });

    // Submit form
    await act(async () => {
      const isValid = await result.current.handleSubmit(mockSubmit);
      expect(isValid).toBe(true);
    });

    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      age: '25'
    });
  });

  test('prevents submission with invalid data', async () => {
    const mockSubmit = jest.fn();
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    // Submit form with empty data
    await act(async () => {
      const isValid = await result.current.handleSubmit(mockSubmit);
      expect(isValid).toBe(false);
    });

    expect(mockSubmit).not.toHaveBeenCalled();
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
  });
});