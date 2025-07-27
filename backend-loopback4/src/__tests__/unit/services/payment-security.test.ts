import { expect } from '@loopback/testlab';
import { PaymentSecurityService } from '../../../services/payment/payment-security.service';
import { HttpErrors } from '@loopback/rest';

describe('PaymentSecurityService', () => {
  describe('validatePaymentData', () => {
    it('should accept valid payment data', async () => {
      const validData = {
        amount: 75,
        bookingId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        email: 'test@example.com',
      };

      // Should not throw
      await expect(
        PaymentSecurityService.validatePaymentData(validData)
      ).to.be.fulfilled();
    });

    it('should reject payment below minimum amount', async () => {
      const invalidData = {
        amount: 0.5,
        bookingId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        email: 'test@example.com',
      };

      await expect(
        PaymentSecurityService.validatePaymentData(invalidData)
      ).to.be.rejectedWith(HttpErrors.BadRequest);
    });

    it('should reject payment above maximum amount', async () => {
      const invalidData = {
        amount: 10000,
        bookingId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        email: 'test@example.com',
      };

      await expect(
        PaymentSecurityService.validatePaymentData(invalidData)
      ).to.be.rejectedWith(HttpErrors.BadRequest);
    });

    it('should reject invalid email format', async () => {
      const invalidData = {
        amount: 75,
        bookingId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        email: 'invalid-email',
      };

      await expect(
        PaymentSecurityService.validatePaymentData(invalidData)
      ).to.be.rejectedWith(HttpErrors.BadRequest);
    });

    it('should detect suspicious patterns in metadata', async () => {
      const suspiciousData = {
        amount: 75,
        bookingId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        email: 'test@example.com',
        metadata: {
          description: '<script>alert("xss")</script>',
        },
      };

      await expect(
        PaymentSecurityService.validatePaymentData(suspiciousData)
      ).to.be.rejectedWith(HttpErrors.BadRequest);
    });
  });

  describe('calculateRiskScore', () => {
    it('should calculate low risk for normal transaction', async () => {
      const data = {
        amount: 75,
        userId: '123e4567-e89b-12d3-a456-426614174001',
        email: 'legitimate@example.com',
        ipAddress: '192.168.1.1',
      };

      const result = await PaymentSecurityService.calculateRiskScore(data);
      
      expect(result.level).to.equal('low');
      expect(result.recommendation).to.equal('allow');
      expect(result.score).to.be.lessThan(30);
    });

    it('should detect suspicious email patterns', async () => {
      const data = {
        amount: 75,
        userId: '123e4567-e89b-12d3-a456-426614174001',
        email: 'test+99999@example.com',
        ipAddress: '192.168.1.1',
      };

      const result = await PaymentSecurityService.calculateRiskScore(data);
      
      expect(result.triggeredRules).to.include('suspicious_email');
      expect(result.score).to.be.greaterThan(0);
    });
  });

  describe('encryptSensitiveData', () => {
    beforeEach(() => {
      // Set a test encryption key
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    });

    it('should encrypt and decrypt data correctly', () => {
      const originalData = 'sensitive payment information';
      
      const encrypted = PaymentSecurityService.encryptSensitiveData(originalData);
      expect(encrypted).to.not.equal(originalData);
      expect(encrypted).to.include(':'); // Should have IV and auth tag
      
      const decrypted = PaymentSecurityService.decryptSensitiveData(encrypted);
      expect(decrypted).to.equal(originalData);
    });

    it('should generate different ciphertext for same plaintext', () => {
      const originalData = 'sensitive payment information';
      
      const encrypted1 = PaymentSecurityService.encryptSensitiveData(originalData);
      const encrypted2 = PaymentSecurityService.encryptSensitiveData(originalData);
      
      expect(encrypted1).to.not.equal(encrypted2); // Different IVs
    });
  });

  describe('generateSecureToken', () => {
    it('should generate token of specified length', () => {
      const token = PaymentSecurityService.generateSecureToken(32);
      expect(token).to.have.lengthOf(64); // 32 bytes = 64 hex chars
    });

    it('should generate unique tokens', () => {
      const token1 = PaymentSecurityService.generateSecureToken();
      const token2 = PaymentSecurityService.generateSecureToken();
      
      expect(token1).to.not.equal(token2);
    });
  });

  describe('hashData', () => {
    it('should produce consistent hash for same input', () => {
      const data = 'payment-reference-123';
      
      const hash1 = PaymentSecurityService.hashData(data);
      const hash2 = PaymentSecurityService.hashData(data);
      
      expect(hash1).to.equal(hash2);
      expect(hash1).to.have.lengthOf(64); // SHA256 = 64 hex chars
    });

    it('should produce different hash for different input', () => {
      const hash1 = PaymentSecurityService.hashData('data1');
      const hash2 = PaymentSecurityService.hashData('data2');
      
      expect(hash1).to.not.equal(hash2);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const sanitized = PaymentSecurityService.sanitizeInput(input);
      
      expect(sanitized).to.equal('Hello  World');
    });

    it('should remove SQL injection attempts', () => {
      const input = "Robert'; DROP TABLE users;--";
      const sanitized = PaymentSecurityService.sanitizeInput(input);
      
      expect(sanitized).to.not.include("'");
      expect(sanitized).to.not.include(";");
    });

    it('should trim whitespace', () => {
      const input = '  valid input  ';
      const sanitized = PaymentSecurityService.sanitizeInput(input);
      
      expect(sanitized).to.equal('valid input');
    });
  });

  describe('validateCardNumber', () => {
    it('should accept valid card numbers', () => {
      // Test card numbers (from Stripe test cards)
      const validCards = [
        '4242424242424242', // Visa
        '5555555555554444', // Mastercard
        '378282246310005',  // Amex
      ];

      for (const card of validCards) {
        expect(PaymentSecurityService.validateCardNumber(card)).to.be.true();
      }
    });

    it('should reject invalid card numbers', () => {
      const invalidCards = [
        '1234567890123456', // Invalid Luhn
        '424242424242',     // Too short
        '42424242424242424242', // Too long
        'abcd1234abcd1234', // Non-numeric
      ];

      for (const card of invalidCards) {
        expect(PaymentSecurityService.validateCardNumber(card)).to.be.false();
      }
    });

    it('should handle cards with spaces and dashes', () => {
      const cardWithSpaces = '4242 4242 4242 4242';
      const cardWithDashes = '4242-4242-4242-4242';
      
      expect(PaymentSecurityService.validateCardNumber(cardWithSpaces)).to.be.true();
      expect(PaymentSecurityService.validateCardNumber(cardWithDashes)).to.be.true();
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within rate limit', async () => {
      const userId = 'test-user-123';
      const ipAddress = '192.168.1.1';

      // First few requests should succeed
      for (let i = 0; i < 5; i++) {
        await expect(
          PaymentSecurityService.checkRateLimit(userId, ipAddress)
        ).to.be.fulfilled();
      }
    });

    it('should block requests exceeding rate limit', async () => {
      const userId = 'rate-limit-test-user';
      const ipAddress = '192.168.1.100';

      // Make many requests to exceed limit
      let blocked = false;
      for (let i = 0; i < 15; i++) {
        try {
          await PaymentSecurityService.checkRateLimit(userId, ipAddress);
        } catch (error) {
          if (error instanceof HttpErrors.TooManyRequests) {
            blocked = true;
            break;
          }
        }
      }

      expect(blocked).to.be.true();
    });
  });
});