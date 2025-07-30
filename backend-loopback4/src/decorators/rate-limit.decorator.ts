import { HttpErrors } from '@loopback/rest';

// Rate limiting decorator
export function rateLimit(requests: number, windowMs: number) {
  const requests_map = new Map<string, { count: number; resetTime: number }>();
  
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const request = args.find(arg => arg?.user?.id);
      const userId = request?.user?.id || 'anonymous';
      const now = Date.now();
      
      const userLimit = requests_map.get(userId);
      if (userLimit) {
        if (now < userLimit.resetTime) {
          if (userLimit.count >= requests) {
            throw new HttpErrors.TooManyRequests(
              `Rate limit exceeded. Try again in ${Math.ceil((userLimit.resetTime - now) / 1000)} seconds`
            );
          }
          userLimit.count++;
        } else {
          requests_map.set(userId, { count: 1, resetTime: now + windowMs });
        }
      } else {
        requests_map.set(userId, { count: 1, resetTime: now + windowMs });
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}