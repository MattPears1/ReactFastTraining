import {
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {RestBindings, Request, HttpErrors} from '@loopback/rest';
import {BookingValidator} from '../validators/booking.validator';
import {CourseValidator} from '../validators/course.validator';
import {UserValidator} from '../validators/user.validator';

interface ValidationConfig {
  validator: string;
  method: string;
  paramIndex?: number;
}

@injectable({tags: {key: ValidationInterceptor.BINDING_KEY}})
export class ValidationInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${ValidationInterceptor.name}`;

  private validators = {
    booking: new BookingValidator(),
    course: new CourseValidator(),
    user: new UserValidator(),
  };

  value() {
    return this.intercept.bind(this);
  }

  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ) {
    const methodName = invocationCtx.methodName;
    const className = invocationCtx.targetClass.name;
    const request = await invocationCtx.get<Request>(RestBindings.Http.REQUEST);
    
    // Get validation configuration from metadata
    const validationConfig = this.getValidationConfig(className, methodName);
    
    if (validationConfig) {
      const validator = this.validators[validationConfig.validator as keyof typeof this.validators];
      
      if (!validator) {
        throw new HttpErrors.InternalServerError(
          `Validator '${validationConfig.validator}' not found`
        );
      }

      // Get the data to validate
      const dataToValidate = this.getDataToValidate(
        invocationCtx.args,
        request,
        validationConfig.paramIndex
      );

      // Perform validation
      const validationMethod = validator[validationConfig.method as keyof typeof validator] as any;
      if (typeof validationMethod !== 'function') {
        throw new HttpErrors.InternalServerError(
          `Validation method '${validationConfig.method}' not found in ${validationConfig.validator}`
        );
      }

      const result = validationMethod.call(validator, dataToValidate);
      
      if (!result.valid) {
        throw new HttpErrors.UnprocessableEntity(
          JSON.stringify({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: result.errors,
          })
        );
      }

      // Replace the original data with sanitized data
      if (result.sanitizedData) {
        if (validationConfig.paramIndex !== undefined) {
          invocationCtx.args[validationConfig.paramIndex] = result.sanitizedData;
        } else {
          // For request body
          const bodyIndex = invocationCtx.args.findIndex(
            arg => arg && typeof arg === 'object' && !Array.isArray(arg)
          );
          if (bodyIndex !== -1) {
            invocationCtx.args[bodyIndex] = result.sanitizedData;
          }
        }
      }
    }

    // Proceed with the intercepted method
    return next();
  }

  private getValidationConfig(className: string, methodName: string): ValidationConfig | null {
    // Validation configuration mapping
    const configs: Record<string, Record<string, ValidationConfig>> = {
      BookingController: {
        create: {validator: 'booking', method: 'validateCreateBooking'},
        updateById: {validator: 'booking', method: 'validateUpdateBooking', paramIndex: 1},
        confirmPayment: {validator: 'booking', method: 'validatePaymentInput'},
        requestCancellation: {validator: 'booking', method: 'validateCancellationRequest'},
        search: {validator: 'booking', method: 'validateSearchCriteria'},
      },
      CourseController: {
        create: {validator: 'course', method: 'validateCreateCourse'},
        updateById: {validator: 'course', method: 'validateUpdateCourse', paramIndex: 1},
      },
      UserController: {
        register: {validator: 'user', method: 'validateRegistration'},
        updateProfile: {validator: 'user', method: 'validateProfileUpdate'},
        changePassword: {validator: 'user', method: 'validatePasswordChange'},
      },
    };

    return configs[className]?.[methodName] || null;
  }

  private getDataToValidate(
    args: InvocationResult[],
    request: Request,
    paramIndex?: number
  ): any {
    if (paramIndex !== undefined) {
      return args[paramIndex];
    }

    // Try to find request body in args
    const bodyData = args.find(
      arg => arg && typeof arg === 'object' && !Array.isArray(arg)
    );

    // If no body in args, try request.body
    return bodyData || request.body || {};
  }
}

// Decorator for applying validation to controller methods
export function validate(validator: string, method: string, paramIndex?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // Store validation metadata
    const className = target.constructor.name;
    
    // This would typically use a metadata storage mechanism
    // For now, we'll add it to the validation configuration in the interceptor
    
    return descriptor;
  };
}