import {injectable, inject} from '@loopback/core';
import * as crypto from 'crypto';
import {HttpErrors} from '@loopback/rest';

export interface EncryptionOptions {
  algorithm?: string;
  keyDerivationIterations?: number;
  saltLength?: number;
  ivLength?: number;
  tagLength?: number;
}

export interface EncryptedData {
  encrypted: string;
  salt: string;
  iv: string;
  tag: string;
  algorithm: string;
  version: number;
}

export interface FieldEncryptionMetadata {
  fields: string[];
  encryptedAt: Date;
  encryptionVersion: number;
}

@injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivationIterations = 100000;
  private readonly saltLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly version = 1;
  
  constructor(
    @inject('encryption.masterKey')
    private masterKey: string,
    @inject('encryption.options', {optional: true})
    private options?: EncryptionOptions
  ) {
    if (!this.masterKey || this.masterKey.length < 32) {
      throw new Error('Invalid master key: must be at least 32 characters');
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encrypt(data: string | object): Promise<EncryptedData> {
    try {
      // Convert object to string if needed
      const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Generate salt and derive key
      const salt = crypto.randomBytes(this.saltLength);
      const key = await this.deriveKey(this.masterKey, salt);
      
      // Generate IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      // Encrypt data
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      return {
        encrypted: encrypted.toString('base64'),
        salt: salt.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        algorithm: this.algorithm,
        version: this.version,
      };
    } catch (error) {
      throw new HttpErrors.InternalServerError(
        `Encryption failed: ${error.message}`
      );
    }
  }

  /**
   * Decrypt data
   */
  async decrypt(encryptedData: EncryptedData): Promise<string> {
    try {
      // Check version compatibility
      if (encryptedData.version > this.version) {
        throw new Error('Encrypted data version not supported');
      }
      
      // Decode from base64
      const encrypted = Buffer.from(encryptedData.encrypted, 'base64');
      const salt = Buffer.from(encryptedData.salt, 'base64');
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const tag = Buffer.from(encryptedData.tag, 'base64');
      
      // Derive key
      const key = await this.deriveKey(this.masterKey, salt);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(encryptedData.algorithm, key, iv);
      decipher.setAuthTag(tag);
      
      // Decrypt data
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      throw new HttpErrors.InternalServerError(
        `Decryption failed: ${error.message}`
      );
    }
  }

  /**
   * Encrypt specific fields in an object
   */
  async encryptFields<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[]
  ): Promise<{ data: T; metadata: FieldEncryptionMetadata }> {
    const encryptedObj = { ...obj };
    const encryptedFields: string[] = [];
    
    for (const field of fields) {
      if (obj[field] !== undefined && obj[field] !== null) {
        const encrypted = await this.encrypt(obj[field]);
        encryptedObj[field] = encrypted as any;
        encryptedFields.push(field as string);
      }
    }
    
    const metadata: FieldEncryptionMetadata = {
      fields: encryptedFields,
      encryptedAt: new Date(),
      encryptionVersion: this.version,
    };
    
    return { data: encryptedObj, metadata };
  }

  /**
   * Decrypt specific fields in an object
   */
  async decryptFields<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[]
  ): Promise<T> {
    const decryptedObj = { ...obj };
    
    for (const field of fields) {
      if (obj[field] && typeof obj[field] === 'object' && 'encrypted' in obj[field]) {
        try {
          const decrypted = await this.decrypt(obj[field] as EncryptedData);
          // Try to parse as JSON if it was originally an object
          try {
            decryptedObj[field] = JSON.parse(decrypted) as any;
          } catch {
            decryptedObj[field] = decrypted as any;
          }
        } catch (error) {
          console.error(`Failed to decrypt field ${String(field)}:`, error);
          // Leave field encrypted if decryption fails
        }
      }
    }
    
    return decryptedObj;
  }

  /**
   * Hash sensitive data (one-way)
   */
  async hash(data: string): Promise<string> {
    return crypto
      .createHash('sha256')
      .update(data + this.masterKey)
      .digest('hex');
  }

  /**
   * Generate secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Derive encryption key from master key and salt
   */
  private async deriveKey(masterKey: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        masterKey,
        salt,
        this.keyDerivationIterations,
        32, // key length for AES-256
        'sha256',
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });
  }

  /**
   * Rotate encryption keys
   */
  async rotateEncryption(
    oldMasterKey: string,
    newMasterKey: string,
    encryptedData: EncryptedData
  ): Promise<EncryptedData> {
    // Create temporary service with old key
    const oldService = new EncryptionService(oldMasterKey, this.options);
    
    // Decrypt with old key
    const decrypted = await oldService.decrypt(encryptedData);
    
    // Create service with new key
    const newService = new EncryptionService(newMasterKey, this.options);
    
    // Encrypt with new key
    return newService.encrypt(decrypted);
  }

  /**
   * Tokenize sensitive data
   */
  async tokenize(data: string): Promise<{ token: string; hint: string }> {
    const token = this.generateToken();
    const hint = data.slice(-4); // Last 4 characters as hint
    
    // Store mapping in secure storage (implementation depends on storage service)
    // await this.secureStorage.store(token, await this.encrypt(data));
    
    return { token, hint };
  }

  /**
   * Detokenize data
   */
  async detokenize(token: string): Promise<string> {
    // Retrieve from secure storage (implementation depends on storage service)
    // const encrypted = await this.secureStorage.retrieve(token);
    // return this.decrypt(encrypted);
    
    throw new Error('Tokenization storage not implemented');
  }
}

/**
 * Field-level encryption decorator
 */
export function Encrypted(fields?: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const encryptionService = (this as any).encryptionService as EncryptionService;
      
      if (!encryptionService) {
        throw new Error('EncryptionService not injected');
      }
      
      // Encrypt specified fields in arguments
      if (fields && args.length > 0 && typeof args[0] === 'object') {
        const { data } = await encryptionService.encryptFields(args[0], fields);
        args[0] = data;
      }
      
      // Call original method
      const result = await originalMethod.apply(this, args);
      
      // Decrypt fields in result if needed
      if (fields && result && typeof result === 'object') {
        return encryptionService.decryptFields(result, fields);
      }
      
      return result;
    };
    
    return descriptor;
  };
}

/**
 * Sensitive data masking utility
 */
export class DataMasker {
  static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!domain) return '***';
    
    const maskedLocal = localPart.length > 2
      ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
      : '*'.repeat(localPart.length);
    
    return `${maskedLocal}@${domain}`;
  }

  static maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '*'.repeat(digits.length);
    
    return digits.slice(0, -4).replace(/./g, '*') + digits.slice(-4);
  }

  static maskCreditCard(cardNumber: string): string {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 8) return '*'.repeat(digits.length);
    
    return '*'.repeat(digits.length - 4) + digits.slice(-4);
  }

  static maskName(name: string): string {
    const parts = name.split(' ');
    return parts.map(part => 
      part.length > 1 ? part[0] + '*'.repeat(part.length - 1) : '*'
    ).join(' ');
  }

  static maskObject<T extends Record<string, any>>(
    obj: T,
    fieldsToMask: Array<keyof T>
  ): T {
    const masked = { ...obj };
    
    for (const field of fieldsToMask) {
      if (masked[field] !== undefined) {
        const value = String(masked[field]);
        
        if (field.toString().toLowerCase().includes('email')) {
          masked[field] = DataMasker.maskEmail(value) as any;
        } else if (field.toString().toLowerCase().includes('phone')) {
          masked[field] = DataMasker.maskPhone(value) as any;
        } else if (field.toString().toLowerCase().includes('card')) {
          masked[field] = DataMasker.maskCreditCard(value) as any;
        } else if (field.toString().toLowerCase().includes('name')) {
          masked[field] = DataMasker.maskName(value) as any;
        } else {
          // Generic masking
          masked[field] = (value.length > 4 
            ? value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2)
            : '*'.repeat(value.length)) as any;
        }
      }
    }
    
    return masked;
  }
}