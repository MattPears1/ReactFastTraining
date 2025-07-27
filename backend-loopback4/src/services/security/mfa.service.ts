import {injectable, inject} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import {v4 as uuid} from 'uuid';

export enum MFAMethod {
  TOTP = 'totp',
  SMS = 'sms',
  EMAIL = 'email',
  BACKUP_CODES = 'backup_codes',
}

export interface MFASetup {
  userId: string;
  method: MFAMethod;
  secret?: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
  phoneNumber?: string;
  email?: string;
  verified: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface MFAVerification {
  userId: string;
  method: MFAMethod;
  code: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TrustedDevice {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  lastUsedAt: Date;
  createdAt: Date;
  ipAddress: string;
  userAgent: string;
}

@injectable()
export class MFAService {
  private readonly appName = 'React Fast Training';
  private readonly totpWindow = 2; // Allow 2 windows for TOTP validation
  private readonly codeExpiry = 300000; // 5 minutes for SMS/Email codes
  private readonly maxAttempts = 5;
  private readonly lockoutDuration = 900000; // 15 minutes
  
  // In-memory storage (should be replaced with proper storage)
  private mfaSetups: Map<string, MFASetup[]> = new Map();
  private pendingCodes: Map<string, {code: string; expiresAt: Date; attempts: number}> = new Map();
  private trustedDevices: Map<string, TrustedDevice[]> = new Map();
  private lockouts: Map<string, Date> = new Map();
  
  constructor(
    @inject('services.encryption')
    private encryptionService: any,
    @inject('services.notification')
    private notificationService: any,
    @inject('services.monitoring')
    private monitoring: any
  ) {}

  /**
   * Setup TOTP (Time-based One-Time Password)
   */
  async setupTOTP(userId: string, userEmail: string): Promise<MFASetup> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${this.appName} (${userEmail})`,
      issuer: this.appName,
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    const setup: MFASetup = {
      userId,
      method: MFAMethod.TOTP,
      secret: await this.encryptionService.encrypt(secret.base32),
      qrCodeUrl,
      verified: false,
      createdAt: new Date(),
    };

    // Store setup (temporarily)
    this.addMFASetup(userId, setup);

    return {
      ...setup,
      secret: secret.base32, // Return unencrypted for display
    };
  }

  /**
   * Setup SMS MFA
   */
  async setupSMS(userId: string, phoneNumber: string): Promise<MFASetup> {
    // Validate phone number
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new HttpErrors.BadRequest('Invalid phone number');
    }

    const setup: MFASetup = {
      userId,
      method: MFAMethod.SMS,
      phoneNumber: await this.encryptionService.encrypt(phoneNumber),
      verified: false,
      createdAt: new Date(),
    };

    // Send verification code
    await this.sendSMSCode(userId, phoneNumber);

    // Store setup
    this.addMFASetup(userId, setup);

    return {
      ...setup,
      phoneNumber: this.maskPhoneNumber(phoneNumber),
    };
  }

  /**
   * Setup Email MFA
   */
  async setupEmail(userId: string, email: string): Promise<MFASetup> {
    const setup: MFASetup = {
      userId,
      method: MFAMethod.EMAIL,
      email: await this.encryptionService.encrypt(email),
      verified: false,
      createdAt: new Date(),
    };

    // Send verification code
    await this.sendEmailCode(userId, email);

    // Store setup
    this.addMFASetup(userId, setup);

    return {
      ...setup,
      email: this.maskEmail(email),
    };
  }

  /**
   * Generate backup codes
   */
  async generateBackupCodes(userId: string): Promise<string[]> {
    const codes: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      const code = this.generateSecureCode(8);
      codes.push(code);
    }

    // Encrypt and store codes
    const hashedCodes = await Promise.all(
      codes.map(code => this.encryptionService.hash(code))
    );

    const setup: MFASetup = {
      userId,
      method: MFAMethod.BACKUP_CODES,
      backupCodes: hashedCodes,
      verified: true,
      createdAt: new Date(),
    };

    this.addMFASetup(userId, setup);

    return codes;
  }

  /**
   * Verify MFA code
   */
  async verifyMFA(verification: MFAVerification): Promise<boolean> {
    // Check lockout
    if (this.isLockedOut(verification.userId)) {
      throw new HttpErrors.TooManyRequests(
        'Too many failed attempts. Please try again later.'
      );
    }

    const setups = this.mfaSetups.get(verification.userId) || [];
    const setup = setups.find(s => s.method === verification.method);

    if (!setup) {
      throw new HttpErrors.NotFound('MFA method not configured');
    }

    let isValid = false;

    switch (verification.method) {
      case MFAMethod.TOTP:
        isValid = await this.verifyTOTP(setup, verification.code);
        break;
      case MFAMethod.SMS:
      case MFAMethod.EMAIL:
        isValid = await this.verifyCode(verification.userId, verification.code);
        break;
      case MFAMethod.BACKUP_CODES:
        isValid = await this.verifyBackupCode(setup, verification.code);
        break;
    }

    if (isValid) {
      // Mark as verified if first time
      if (!setup.verified) {
        setup.verified = true;
      }
      setup.lastUsedAt = new Date();

      // Clear lockout
      this.lockouts.delete(verification.userId);

      // Record successful verification
      this.monitoring.recordMetric({
        name: 'mfa.verification.success',
        value: 1,
        unit: 'count',
        tags: { method: verification.method },
      });
    } else {
      // Track failed attempt
      this.trackFailedAttempt(verification.userId);

      // Record failed verification
      this.monitoring.recordMetric({
        name: 'mfa.verification.failed',
        value: 1,
        unit: 'count',
        tags: { method: verification.method },
      });
    }

    return isValid;
  }

  /**
   * Trust a device
   */
  async trustDevice(
    userId: string,
    deviceId: string,
    deviceName: string,
    ipAddress: string,
    userAgent: string
  ): Promise<TrustedDevice> {
    const trustedDevice: TrustedDevice = {
      id: uuid(),
      userId,
      deviceId,
      deviceName,
      lastUsedAt: new Date(),
      createdAt: new Date(),
      ipAddress,
      userAgent,
    };

    // Store trusted device
    if (!this.trustedDevices.has(userId)) {
      this.trustedDevices.set(userId, []);
    }
    this.trustedDevices.get(userId)!.push(trustedDevice);

    return trustedDevice;
  }

  /**
   * Check if device is trusted
   */
  isTrustedDevice(userId: string, deviceId: string): boolean {
    const devices = this.trustedDevices.get(userId) || [];
    const device = devices.find(d => d.deviceId === deviceId);
    
    if (!device) return false;

    // Check if device trust has expired (30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return device.lastUsedAt > thirtyDaysAgo;
  }

  /**
   * Get user's MFA methods
   */
  getUserMFAMethods(userId: string): MFAMethod[] {
    const setups = this.mfaSetups.get(userId) || [];
    return setups
      .filter(s => s.verified)
      .map(s => s.method);
  }

  /**
   * Remove MFA method
   */
  async removeMFAMethod(userId: string, method: MFAMethod): Promise<void> {
    const setups = this.mfaSetups.get(userId) || [];
    const filtered = setups.filter(s => s.method !== method);
    
    if (filtered.length === 0) {
      throw new HttpErrors.BadRequest(
        'Cannot remove last MFA method'
      );
    }

    this.mfaSetups.set(userId, filtered);
  }

  /**
   * Private helper methods
   */
  
  private async verifyTOTP(setup: MFASetup, code: string): Promise<boolean> {
    if (!setup.secret) return false;

    const decryptedSecret = await this.encryptionService.decrypt(setup.secret);
    
    return speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: code,
      window: this.totpWindow,
    });
  }

  private async verifyCode(userId: string, code: string): Promise<boolean> {
    const pendingCode = this.pendingCodes.get(userId);
    
    if (!pendingCode) return false;
    
    if (new Date() > pendingCode.expiresAt) {
      this.pendingCodes.delete(userId);
      return false;
    }

    if (pendingCode.code === code) {
      this.pendingCodes.delete(userId);
      return true;
    }

    pendingCode.attempts++;
    return false;
  }

  private async verifyBackupCode(setup: MFASetup, code: string): Promise<boolean> {
    if (!setup.backupCodes) return false;

    const hashedCode = await this.encryptionService.hash(code);
    const index = setup.backupCodes.indexOf(hashedCode);
    
    if (index > -1) {
      // Remove used backup code
      setup.backupCodes.splice(index, 1);
      return true;
    }

    return false;
  }

  private async sendSMSCode(userId: string, phoneNumber: string): Promise<void> {
    const code = this.generateSecureCode(6);
    
    // Store pending code
    this.pendingCodes.set(userId, {
      code,
      expiresAt: new Date(Date.now() + this.codeExpiry),
      attempts: 0,
    });

    // Send SMS (implement with actual SMS service)
    await this.notificationService.sendSMS(phoneNumber, 
      `Your React Fast Training verification code is: ${code}`
    );
  }

  private async sendEmailCode(userId: string, email: string): Promise<void> {
    const code = this.generateSecureCode(6);
    
    // Store pending code
    this.pendingCodes.set(userId, {
      code,
      expiresAt: new Date(Date.now() + this.codeExpiry),
      attempts: 0,
    });

    // Send email
    await this.notificationService.sendEmail({
      to: email,
      subject: 'Your React Fast Training Verification Code',
      template: 'mfa-code',
      data: { code },
    });
  }

  private generateSecureCode(length: number): string {
    const digits = '0123456789';
    let code = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      code += digits[randomIndex];
    }
    
    return code;
  }

  private addMFASetup(userId: string, setup: MFASetup): void {
    if (!this.mfaSetups.has(userId)) {
      this.mfaSetups.set(userId, []);
    }
    
    const setups = this.mfaSetups.get(userId)!;
    const existingIndex = setups.findIndex(s => s.method === setup.method);
    
    if (existingIndex > -1) {
      setups[existingIndex] = setup;
    } else {
      setups.push(setup);
    }
  }

  private isValidPhoneNumber(phone: string): boolean {
    // UK phone number validation
    const ukPhoneRegex = /^(\+44|0)[1-9]\d{9,10}$/;
    return ukPhoneRegex.test(phone.replace(/\s/g, ''));
  }

  private maskPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return `****${digits.slice(-4)}`;
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const masked = localPart.slice(0, 2) + '****';
    return `${masked}@${domain}`;
  }

  private trackFailedAttempt(userId: string): void {
    const pending = this.pendingCodes.get(userId);
    
    if (pending) {
      pending.attempts++;
      
      if (pending.attempts >= this.maxAttempts) {
        this.lockouts.set(userId, new Date(Date.now() + this.lockoutDuration));
        this.pendingCodes.delete(userId);
      }
    }
  }

  private isLockedOut(userId: string): boolean {
    const lockoutExpiry = this.lockouts.get(userId);
    
    if (!lockoutExpiry) return false;
    
    if (new Date() > lockoutExpiry) {
      this.lockouts.delete(userId);
      return false;
    }
    
    return true;
  }
}