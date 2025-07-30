import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  ReactNode,
} from "react";

export interface ContextOptions<T> {
  displayName?: string;
  errorMessage?: string;
  devtools?: boolean;
}

export interface ProviderProps {
  children: ReactNode;
}

export type Selector<T, S> = (state: T) => S;
export type EqualityFn<T> = (a: T, b: T) => boolean;

// Default shallow equality check
const defaultEqualityFn = <T,>(a: T, b: T): boolean => a === b;

// Deep equality check for objects
export const deepEqual = <T,>(a: T, b: T): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== "object" || typeof b !== "object") return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => deepEqual((a as any)[key], (b as any)[key]));
};

export function createOptimizedContext<State, Actions>(
  options: ContextOptions<State> = {},
) {
  const {
    displayName = "OptimizedContext",
    errorMessage = `use${displayName} must be used within ${displayName}Provider`,
    devtools = process.env.NODE_ENV === "development",
  } = options;

  // Create separate contexts for state and dispatch
  const StateContext = createContext<State | undefined>(undefined);
  const DispatchContext = createContext<Actions | undefined>(undefined);

  StateContext.displayName = `${displayName}State`;
  DispatchContext.displayName = `${displayName}Dispatch`;

  // Provider component
  function Provider({
    children,
    initialState,
    actions,
    reducer,
    middleware = [],
  }: ProviderProps & {
    initialState: State;
    actions: (dispatch: React.Dispatch<any>, getState: () => State) => Actions;
    reducer?: (state: State, action: any) => State;
    middleware?: Array<(state: State, action: any, next: () => void) => void>;
  }) {
    const [state, dispatch] = useReducer(
      reducer || ((state: State) => state),
      initialState,
    );

    // Ref to get current state without causing re-renders
    const stateRef = useRef(state);
    stateRef.current = state;
    const getState = useCallback(() => stateRef.current, []);

    // Apply middleware
    const enhancedDispatch = useMemo(() => {
      if (middleware.length === 0) return dispatch;

      return (action: any) => {
        const chain = [...middleware].reverse();
        let index = 0;

        const next = () => {
          if (index >= chain.length) {
            dispatch(action);
          } else {
            const middlewareFn = chain[index++];
            middlewareFn(stateRef.current, action, next);
          }
        };

        next();
      };
    }, [middleware]);

    // Create memoized actions
    const memoizedActions = useMemo(
      () => actions(enhancedDispatch, getState),
      [enhancedDispatch, getState],
    );

    // DevTools integration
    useEffect(() => {
      if (
        devtools &&
        typeof window !== "undefined" &&
        (window as any).__REDUX_DEVTOOLS_EXTENSION__
      ) {
        const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({
          name: displayName,
        });

        devTools.init(state);

        const unsubscribe = devTools.subscribe((message: any) => {
          if (message.type === "DISPATCH" && message.state) {
            // Handle time travel debugging
            console.log("DevTools time travel:", message);
          }
        });

        return () => {
          unsubscribe();
          devTools.disconnect();
        };
      }
    }, [devtools, state]);

    return (
      <StateContext.Provider value={state}>
        <DispatchContext.Provider value={memoizedActions}>
          {children}
        </DispatchContext.Provider>
      </StateContext.Provider>
    );
  }

  // Hook to use state with selector and equality function
  function useContextState<Selected = State>(
    selector?: Selector<State, Selected>,
    equalityFn: EqualityFn<Selected> = defaultEqualityFn,
  ): Selected {
    const state = useContext(StateContext);

    if (state === undefined) {
      throw new Error(errorMessage);
    }

    const selectedState = selector
      ? selector(state)
      : (state as unknown as Selected);
    const selectedStateRef = useRef(selectedState);
    const [, forceUpdate] = useReducer((x) => x + 1, 0);

    useEffect(() => {
      if (!equalityFn(selectedState, selectedStateRef.current)) {
        selectedStateRef.current = selectedState;
        forceUpdate();
      }
    });

    return selectedStateRef.current;
  }

  // Hook to use dispatch/actions
  function useContextDispatch(): Actions {
    const dispatch = useContext(DispatchContext);

    if (dispatch === undefined) {
      throw new Error(errorMessage);
    }

    return dispatch;
  }

  // Combined hook
  function useContextValue<Selected = State>(
    selector?: Selector<State, Selected>,
    equalityFn?: EqualityFn<Selected>,
  ): [Selected, Actions] {
    return [useContextState(selector, equalityFn), useContextDispatch()];
  }

  return {
    Provider,
    useContextState,
    useContextDispatch,
    useContextValue,
  };
}

// Example usage with performance monitoring
export function createMonitoredContext<State, Actions>(
  name: string,
  options?: ContextOptions<State>,
) {
  const context = createOptimizedContext<State, Actions>({
    ...options,
    displayName: name,
  });

  // Add performance monitoring middleware
  const performanceMiddleware = (
    state: State,
    action: any,
    next: () => void,
  ) => {
    const start = performance.now();
    next();
    const end = performance.now();

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[${name}] Action ${action.type} took ${(end - start).toFixed(2)}ms`,
      );
    }
  };

  // Logging middleware
  const loggingMiddleware = (state: State, action: any, next: () => void) => {
    if (process.env.NODE_ENV === "development") {
      console.group(`[${name}] ${action.type}`);
      console.log("Prev State:", state);
      console.log("Action:", action);
      next();
      console.log("Next State:", state);
      console.groupEnd();
    } else {
      next();
    }
  };

  return {
    ...context,
    middleware: {
      performance: performanceMiddleware,
      logging: loggingMiddleware,
    },
  };
}

// Create a context with built-in persistence
export function createPersistedContext<State, Actions>(
  name: string,
  options?: ContextOptions<State> & {
    storage?: Storage;
    serialize?: (state: State) => string;
    deserialize?: (data: string) => State;
  },
) {
  const {
    storage = localStorage,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    ...contextOptions
  } = options || {};

  const context = createOptimizedContext<State, Actions>(contextOptions);
  const storageKey = `persisted-context-${name}`;

  // Persistence middleware
  const persistenceMiddleware = (
    state: State,
    action: any,
    next: () => void,
  ) => {
    next();

    try {
      storage.setItem(storageKey, serialize(state));
    } catch (error) {
      console.error(`Failed to persist ${name} state:`, error);
    }
  };

  // Load initial state from storage
  const loadPersistedState = (defaultState: State): State => {
    try {
      const persistedData = storage.getItem(storageKey);
      if (persistedData) {
        return deserialize(persistedData);
      }
    } catch (error) {
      console.error(`Failed to load persisted ${name} state:`, error);
    }
    return defaultState;
  };

  return {
    ...context,
    loadPersistedState,
    persistenceMiddleware,
  };
}
