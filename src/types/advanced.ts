/**
 * Advanced TypeScript type utilities and patterns
 */

// Utility Types
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type DeepRequired<T> = T extends object
  ? {
      [P in keyof T]-?: DeepRequired<T[P]>;
    }
  : T;

export type DeepReadonly<T> = T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    }
  : T;

// Pick nested properties
export type DeepPick<T, K extends string> = K extends `${infer K1}.${infer K2}`
  ? K1 extends keyof T
    ? { [P in K1]: DeepPick<T[P], K2> }
    : never
  : K extends keyof T
    ? { [P in K]: T[P] }
    : never;

// Omit nested properties
export type DeepOmit<T, K extends string> = K extends `${infer K1}.${infer K2}`
  ? K1 extends keyof T
    ? Omit<T, K1> & { [P in K1]: DeepOmit<T[P], K2> }
    : T
  : Omit<T, K>;

// Make specific properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific properties required
export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

// Extract non-nullable types
export type NonNullableKeys<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends never ? never : K;
}[keyof T];

// Get all paths of an object type
export type Paths<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? K | `${K}.${Paths<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

// Get type at path
export type PathValue<
  T,
  P extends string,
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Paths<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;

// Function types
export type AsyncFunction<T = void> = () => Promise<T>;
export type AsyncFunctionWithArgs<TArgs extends any[], TReturn = void> = (
  ...args: TArgs
) => Promise<TReturn>;

// API Response types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    timestamp: string;
    version: string;
    [key: string]: any;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Result type for error handling
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export const Result = {
  ok: <T>(data: T): Result<T> => ({ success: true, data }),
  err: <E>(error: E): Result<never, E> => ({ success: false, error }),

  map: <T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> => {
    if (result.success) {
      return Result.ok(fn(result.data));
    }
    return result;
  },

  mapError: <T, E, F>(
    result: Result<T, E>,
    fn: (error: E) => F,
  ): Result<T, F> => {
    if (!result.success) {
      return Result.err(fn(result.error));
    }
    return result as Result<T, F>;
  },

  unwrap: <T, E>(result: Result<T, E>): T => {
    if (result.success) {
      return result.data;
    }
    throw result.error;
  },

  unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T): T => {
    if (result.success) {
      return result.data;
    }
    return defaultValue;
  },
};

// Option type for nullable values
export type Option<T> = T | null | undefined;

export const Option = {
  some: <T>(value: T): Option<T> => value,
  none: <T>(): Option<T> => null,

  isSome: <T>(option: Option<T>): option is T => {
    return option !== null && option !== undefined;
  },

  isNone: <T>(option: Option<T>): option is null | undefined => {
    return option === null || option === undefined;
  },

  map: <T, U>(option: Option<T>, fn: (value: T) => U): Option<U> => {
    if (Option.isSome(option)) {
      return fn(option);
    }
    return null;
  },

  flatMap: <T, U>(
    option: Option<T>,
    fn: (value: T) => Option<U>,
  ): Option<U> => {
    if (Option.isSome(option)) {
      return fn(option);
    }
    return null;
  },

  unwrapOr: <T>(option: Option<T>, defaultValue: T): T => {
    if (Option.isSome(option)) {
      return option;
    }
    return defaultValue;
  },
};

// Branded types for type safety
export type Brand<K, T> = K & { __brand: T };

export type UserId = Brand<string, "UserId">;
export type SessionId = Brand<string, "SessionId">;
export type BookingId = Brand<string, "BookingId">;
export type Email = Brand<string, "Email">;
export type URL = Brand<string, "URL">;

// Type guards
export const isUserId = (value: string): value is UserId => {
  return /^usr_[a-zA-Z0-9]{16}$/.test(value);
};

export const isSessionId = (value: string): value is SessionId => {
  return /^sess_[a-zA-Z0-9]{16}$/.test(value);
};

export const isBookingId = (value: string): value is BookingId => {
  return /^book_[a-zA-Z0-9]{16}$/.test(value);
};

export const isEmail = (value: string): value is Email => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const isURL = (value: string): value is URL => {
  try {
    new window.URL(value);
    return true;
  } catch {
    return false;
  }
};

// Discriminated unions
export type LoadingState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

// Template literal types
export type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type APIEndpoint = `/api/${string}`;
export type Route = `/${string}`;

// Conditional types
export type IsArray<T> = T extends any[] ? true : false;
export type IsObject<T> = T extends object ? true : false;
export type IsFunction<T> = T extends (...args: any[]) => any ? true : false;

// Extract promise type
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

// Extract array element type
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

// Tuple utilities
export type Head<T extends any[]> = T extends [infer H, ...any[]] ? H : never;
export type Tail<T extends any[]> = T extends [any, ...infer Tail] ? Tail : [];
export type Length<T extends any[]> = T["length"];

// String literal manipulation
export type Uppercase<S extends string> = S extends `${infer C}${infer R}`
  ? `${Uppercase<C>}${Uppercase<R>}`
  : S;

export type Lowercase<S extends string> = S extends `${infer C}${infer R}`
  ? `${Lowercase<C>}${Lowercase<R>}`
  : S;

export type Capitalize<S extends string> = S extends `${infer C}${infer R}`
  ? `${Uppercase<C>}${R}`
  : S;

// Validation result type
export interface ValidationResult<T = any> {
  valid: boolean;
  errors: ValidationError[];
  data?: T;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  meta?: Record<string, any>;
}

// Event emitter types
export type EventMap = Record<string, any>;
export type EventKey<T extends EventMap> = string & keyof T;
export type EventHandler<T> = (payload: T) => void;

export interface TypedEventEmitter<T extends EventMap> {
  on<K extends EventKey<T>>(event: K, handler: EventHandler<T[K]>): void;
  off<K extends EventKey<T>>(event: K, handler: EventHandler<T[K]>): void;
  emit<K extends EventKey<T>>(event: K, payload: T[K]): void;
  once<K extends EventKey<T>>(event: K, handler: EventHandler<T[K]>): void;
}
