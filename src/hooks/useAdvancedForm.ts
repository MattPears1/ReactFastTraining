import { useState, useCallback, useRef, useEffect } from 'react';
import { z, ZodSchema, ZodError } from 'zod';
import { DeepPartial, PathValue, Paths } from '@types/advanced';
import { debounce } from '@utils/performance';

export interface FormField<T> {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
  validating: boolean;
}

export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  validating: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  submitCount: number;
}

export interface UseAdvancedFormOptions<T> {
  initialValues: T;
  validationSchema?: ZodSchema<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnMount?: boolean;
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  resetOnSubmit?: boolean;
  onSubmit?: (values: T) => Promise<void> | void;
  onError?: (errors: Partial<Record<keyof T, string>>) => void;
  debounceDelay?: number;
}

export interface FieldOptions {
  validate?: (value: any) => string | null | Promise<string | null>;
  transform?: (value: any) => any;
  format?: (value: any) => string;
  parse?: (value: string) => any;
}

export function useAdvancedForm<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  validateOnChange = true,
  validateOnBlur = true,
  validateOnMount = false,
  reValidateMode = 'onChange',
  resetOnSubmit = false,
  onSubmit,
  onError,
  debounceDelay = 300,
}: UseAdvancedFormOptions<T>) {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    dirty: {},
    validating: {},
    isSubmitting: false,
    isValid: true,
    isDirty: false,
    submitCount: 0,
  });

  const fieldRefs = useRef<Map<keyof T, HTMLElement>>(new Map());
  const fieldOptions = useRef<Map<keyof T, FieldOptions>>(new Map());
  const validationTimeouts = useRef<Map<keyof T, NodeJS.Timeout>>(new Map());

  // Validate entire form
  const validateForm = useCallback(
    async (values: T): Promise<Partial<Record<keyof T, string>>> => {
      if (!validationSchema) return {};

      try {
        await validationSchema.parseAsync(values);
        return {};
      } catch (error) {
        if (error instanceof ZodError) {
          const errors: Partial<Record<keyof T, string>> = {};
          error.errors.forEach((err) => {
            const path = err.path.join('.') as keyof T;
            errors[path] = err.message;
          });
          return errors;
        }
        return {};
      }
    },
    [validationSchema]
  );

  // Validate single field
  const validateField = useCallback(
    async (name: keyof T, value: any): Promise<string | null> => {
      const options = fieldOptions.current.get(name);
      
      // Custom field validation
      if (options?.validate) {
        const error = await options.validate(value);
        if (error) return error;
      }

      // Schema validation
      if (validationSchema && name in validationSchema.shape) {
        try {
          const fieldSchema = (validationSchema.shape as any)[name];
          await fieldSchema.parseAsync(value);
          return null;
        } catch (error) {
          if (error instanceof ZodError) {
            return error.errors[0]?.message || 'Validation error';
          }
          return 'Validation error';
        }
      }

      return null;
    },
    [validationSchema]
  );

  // Debounced validation
  const debouncedValidateField = useCallback(
    debounce(async (name: keyof T, value: any) => {
      setState((prev) => ({
        ...prev,
        validating: { ...prev.validating, [name]: true },
      }));

      const error = await validateField(name, value);

      setState((prev) => ({
        ...prev,
        errors: { ...prev.errors, [name]: error || undefined },
        validating: { ...prev.validating, [name]: false },
        isValid: !error && Object.values({ ...prev.errors, [name]: error }).every((e) => !e),
      }));
    }, debounceDelay),
    [validateField, debounceDelay]
  );

  // Set field value
  const setValue = useCallback(
    <K extends keyof T>(name: K, value: T[K], shouldValidate = validateOnChange) => {
      const options = fieldOptions.current.get(name);
      const transformedValue = options?.transform ? options.transform(value) : value;

      setState((prev) => {
        const newValues = { ...prev.values, [name]: transformedValue };
        const isDirty = JSON.stringify(newValues) !== JSON.stringify(initialValues);

        return {
          ...prev,
          values: newValues,
          dirty: { ...prev.dirty, [name]: true },
          isDirty,
        };
      });

      if (shouldValidate) {
        debouncedValidateField(name, transformedValue);
      }
    },
    [initialValues, validateOnChange, debouncedValidateField]
  );

  // Set multiple values
  const setValues = useCallback(
    (values: DeepPartial<T>, shouldValidate = validateOnChange) => {
      setState((prev) => {
        const newValues = { ...prev.values, ...values };
        const isDirty = JSON.stringify(newValues) !== JSON.stringify(initialValues);

        return {
          ...prev,
          values: newValues as T,
          isDirty,
        };
      });

      if (shouldValidate) {
        Object.entries(values).forEach(([name, value]) => {
          debouncedValidateField(name as keyof T, value);
        });
      }
    },
    [initialValues, validateOnChange, debouncedValidateField]
  );

  // Touch field
  const touchField = useCallback(
    (name: keyof T, shouldValidate = validateOnBlur) => {
      setState((prev) => ({
        ...prev,
        touched: { ...prev.touched, [name]: true },
      }));

      if (shouldValidate && state.dirty[name]) {
        debouncedValidateField(name, state.values[name]);
      }
    },
    [validateOnBlur, debouncedValidateField, state.values, state.dirty]
  );

  // Set error
  const setError = useCallback((name: keyof T, error: string | null) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [name]: error || undefined },
      isValid: !error && Object.values({ ...prev.errors, [name]: error }).every((e) => !e),
    }));
  }, []);

  // Set multiple errors
  const setErrors = useCallback((errors: Partial<Record<keyof T, string>>) => {
    setState((prev) => ({
      ...prev,
      errors,
      isValid: Object.values(errors).every((e) => !e),
    }));
  }, []);

  // Reset form
  const reset = useCallback(
    (values?: DeepPartial<T>) => {
      // Clear validation timeouts
      validationTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      validationTimeouts.current.clear();

      setState({
        values: values ? { ...initialValues, ...values } : initialValues,
        errors: {},
        touched: {},
        dirty: {},
        validating: {},
        isSubmitting: false,
        isValid: true,
        isDirty: false,
        submitCount: 0,
      });
    },
    [initialValues]
  );

  // Register field
  const register = useCallback(
    <K extends keyof T>(name: K, options?: FieldOptions) => {
      if (options) {
        fieldOptions.current.set(name, options);
      }

      return {
        name,
        value: options?.format ? options.format(state.values[name]) : state.values[name],
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
          const value = e.target.value;
          const parsedValue = options?.parse ? options.parse(value) : value;
          setValue(name, parsedValue);
        },
        onBlur: () => touchField(name),
        ref: (el: HTMLElement | null) => {
          if (el) {
            fieldRefs.current.set(name, el);
          } else {
            fieldRefs.current.delete(name);
          }
        },
        'aria-invalid': !!state.errors[name],
        'aria-describedby': state.errors[name] ? `${String(name)}-error` : undefined,
      };
    },
    [state.values, state.errors, setValue, touchField]
  );

  // Get field state
  const getFieldState = useCallback(
    <K extends keyof T>(name: K): FormField<T[K]> => ({
      value: state.values[name],
      error: state.errors[name] || null,
      touched: state.touched[name] || false,
      dirty: state.dirty[name] || false,
      validating: state.validating[name] || false,
    }),
    [state]
  );

  // Handle submit
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      return async () => {
        setState((prev) => ({
          ...prev,
          isSubmitting: true,
          submitCount: prev.submitCount + 1,
        }));

        // Touch all fields
        const allTouched = Object.keys(state.values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {}
        );
        setState((prev) => ({ ...prev, touched: allTouched as any }));

        // Validate all fields
        const errors = await validateForm(state.values);
        
        if (Object.keys(errors).length > 0) {
          setState((prev) => ({
            ...prev,
            errors,
            isSubmitting: false,
            isValid: false,
          }));
          
          onError?.(errors);
          
          // Focus first error field
          const firstErrorField = Object.keys(errors)[0] as keyof T;
          const fieldEl = fieldRefs.current.get(firstErrorField);
          fieldEl?.focus();
          
          return;
        }

        try {
          await onSubmit?.(state.values);
          
          if (resetOnSubmit) {
            reset();
          } else {
            setState((prev) => ({
              ...prev,
              isSubmitting: false,
              dirty: {},
              isDirty: false,
            }));
          }
        } catch (error) {
          setState((prev) => ({ ...prev, isSubmitting: false }));
          throw error;
        }
      };
    },
    [state.values, validateForm, onSubmit, onError, resetOnSubmit, reset]
  );

  // Watch field value
  const watch = useCallback(
    <K extends keyof T>(name: K): T[K] => {
      return state.values[name];
    },
    [state.values]
  );

  // Watch multiple fields
  const watchAll = useCallback(
    <K extends keyof T>(...names: K[]): Pick<T, K> => {
      return names.reduce(
        (acc, name) => ({ ...acc, [name]: state.values[name] }),
        {} as Pick<T, K>
      );
    },
    [state.values]
  );

  // Validate on mount
  useEffect(() => {
    if (validateOnMount) {
      validateForm(state.values).then((errors) => {
        if (Object.keys(errors).length > 0) {
          setErrors(errors);
        }
      });
    }
  }, [validateOnMount, validateForm, setErrors, state.values]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      validationTimeouts.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  return {
    // State
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    isDirty: state.isDirty,
    submitCount: state.submitCount,
    
    // Methods
    setValue,
    setValues,
    setError,
    setErrors,
    touchField,
    register,
    getFieldState,
    handleSubmit,
    reset,
    watch,
    watchAll,
    
    // Validation
    validateField,
    validateForm,
  };
}