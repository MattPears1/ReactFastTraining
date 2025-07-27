import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((prevValue: T) => T);

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    onError?: (error: Error) => void;
  }
): [T, (value: SetValue<T>) => void, () => void] {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    onError = console.error,
  } = options || {};

  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      onError(error as Error);
      return initialValue;
    }
  });

  // Set value in both state and localStorage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, serialize(valueToStore));
        
        // Dispatch custom event for cross-tab synchronization
        window.dispatchEvent(
          new CustomEvent('local-storage-change', {
            detail: { key, value: valueToStore },
          })
        );
      } catch (error) {
        onError(error as Error);
      }
    },
    [key, serialize, storedValue, onError]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      
      // Dispatch custom event for cross-tab synchronization
      window.dispatchEvent(
        new CustomEvent('local-storage-change', {
          detail: { key, value: null },
        })
      );
    } catch (error) {
      onError(error as Error);
    }
  }, [key, initialValue, onError]);

  // Listen for changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(deserialize(event.newValue));
        } catch (error) {
          onError(error as Error);
        }
      }
    };

    const handleCustomStorageChange = (event: CustomEvent) => {
      if (event.detail.key === key) {
        setStoredValue(event.detail.value ?? initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(
      'local-storage-change',
      handleCustomStorageChange as EventListener
    );

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(
        'local-storage-change',
        handleCustomStorageChange as EventListener
      );
    };
  }, [key, deserialize, initialValue, onError]);

  return [storedValue, setValue, removeValue];
}

// Specialized hook for storing user preferences
export function useUserPreferences<T extends Record<string, any>>(
  defaultPreferences: T
): {
  preferences: T;
  updatePreference: <K extends keyof T>(key: K, value: T[K]) => void;
  resetPreferences: () => void;
} {
  const [preferences, setPreferences, resetPreferences] = useLocalStorage(
    'userPreferences',
    defaultPreferences
  );

  const updatePreference = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setPreferences((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [setPreferences]
  );

  return {
    preferences,
    updatePreference,
    resetPreferences,
  };
}