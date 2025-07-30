import { Request, HttpErrors } from '@loopback/rest';
import { SessionService } from '../services/session.service';
import { UserService } from '../services/user.service';
import { User } from '../db/schema/users';
import { Session } from '../db/schema/sessions';

export interface AuthenticatedRequest extends Request {
  user?: User;
  session?: Session;
}

export async function authenticate(req: AuthenticatedRequest) {
  const token = extractToken(req);
  
  if (!token) {
    throw new HttpErrors.Unauthorized('No authentication token provided');
  }

  const session = await SessionService.validateSession(token);
  
  if (!session) {
    throw new HttpErrors.Unauthorized('Invalid or expired session');
  }

  const user = await UserService.findById(session.userId);
  
  if (!user) {
    throw new HttpErrors.Unauthorized('User not found');
  }

  req.user = user;
  req.session = session;
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}