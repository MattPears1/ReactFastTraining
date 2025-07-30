export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class StripeErrorService {
  static formatError(error: any): any {
    if (error instanceof Error) {
      return {
        message: error.message,
        type: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        code: (error as any).code,
        statusCode: (error as any).statusCode,
      };
    }
    return error;
  }

  static isNonRetryableError(error: any): boolean {
    if (!error.type) return false;
    
    const nonRetryableTypes = [
      'StripeCardError',
      'StripeInvalidRequestError',
      'StripeAuthenticationError',
    ];
    
    return nonRetryableTypes.includes(error.type);
  }
}