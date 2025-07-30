import {injectable, BindingScope} from '@loopback/core';
import * as jwt from 'jsonwebtoken';

export interface JWTUser {
  id: number;
  email: string;
  role: string;
}

@injectable({scope: BindingScope.TRANSIENT})
export class JWTService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET || 'default-secret-change-this';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-this';
    this.accessTokenExpiry = '15m';
    this.refreshTokenExpiry = '7d';
  }

  async generateAccessToken(user: any): Promise<string> {
    const payload: JWTUser = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'reactfasttraining.co.uk',
      audience: 'admin'
    });
  }

  async generateRefreshToken(user: any): Promise<string> {
    const payload = {
      id: user.id,
      type: 'refresh'
    };

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'reactfasttraining.co.uk',
      audience: 'admin'
    });
  }

  async verifyAccessToken(token: string): Promise<JWTUser> {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'reactfasttraining.co.uk',
        audience: 'admin'
      }) as JWTUser;
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async verifyRefreshToken(token: string): Promise<{id: number; type: string}> {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'reactfasttraining.co.uk',
        audience: 'admin'
      }) as {id: number; type: string};
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    return authHeader.substring(7);
  }
}