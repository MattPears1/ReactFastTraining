import { config } from 'dotenv';
config();

export const servicesConfig = {
  email: {
    defaultProvider: process.env.EMAIL_PROVIDER || 'sendgrid',
    providers: {
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY,
        from: process.env.EMAIL_FROM || 'noreply@example.com',
        replyTo: process.env.EMAIL_REPLY_TO,
      },
      ses: {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
    },
    queue: {
      maxRetries: 3,
      retryDelay: 60000,
      batchSize: 100,
    },
  },
  
  storage: {
    defaultProvider: process.env.STORAGE_PROVIDER || 'local',
    providers: {
      local: {
        uploadDir: process.env.UPLOAD_DIR || './uploads',
        publicUrl: process.env.PUBLIC_URL || 'http://localhost:3000',
      },
      s3: {
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        signedUrlExpiry: 3600,
      },
      cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
      },
    },
    upload: {
      maxFileSize: 10 * 1024 * 1024,
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      imageOptimization: {
        quality: 80,
        formats: ['webp', 'jpeg'],
        sizes: {
          thumbnail: { width: 150, height: 150 },
          small: { width: 300, height: 300 },
          medium: { width: 600, height: 600 },
          large: { width: 1200, height: 1200 },
        },
      },
    },
  },
  
  analytics: {
    providers: {
      internal: {
        enabled: true,
        retention: 90,
      },
      googleAnalytics: {
        enabled: process.env.GA_ENABLED === 'true',
        measurementId: process.env.GA_MEASUREMENT_ID,
      },
      mixpanel: {
        enabled: process.env.MIXPANEL_ENABLED === 'true',
        token: process.env.MIXPANEL_TOKEN,
      },
    },
    privacy: {
      anonymizeIp: true,
      respectDoNotTrack: true,
      cookieConsent: true,
      dataRetention: 90,
    },
  },
  
  search: {
    defaultProvider: process.env.SEARCH_PROVIDER || 'elasticsearch',
    providers: {
      elasticsearch: {
        node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
        auth: {
          username: process.env.ELASTICSEARCH_USERNAME,
          password: process.env.ELASTICSEARCH_PASSWORD,
        },
        maxRetries: 3,
        requestTimeout: 30000,
      },
      algolia: {
        appId: process.env.ALGOLIA_APP_ID,
        apiKey: process.env.ALGOLIA_API_KEY,
        indexPrefix: process.env.ALGOLIA_INDEX_PREFIX || 'prod',
      },
    },
    settings: {
      resultsPerPage: 20,
      maxPages: 50,
      highlightTag: 'em',
      typoTolerance: true,
    },
  },
  
  payment: {
    defaultProvider: process.env.PAYMENT_PROVIDER || 'stripe',
    providers: {
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        apiVersion: '2023-10-16',
      },
      paypal: {
        mode: process.env.PAYPAL_MODE || 'sandbox',
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      },
    },
    currency: process.env.DEFAULT_CURRENCY || 'USD',
    taxRates: {
      default: 0,
      byCountry: {},
    },
  },
  
  notification: {
    channels: {
      email: {
        enabled: true,
        provider: 'email',
      },
      sms: {
        enabled: process.env.SMS_ENABLED === 'true',
        provider: 'twilio',
        from: process.env.TWILIO_PHONE_NUMBER,
      },
      push: {
        enabled: process.env.PUSH_ENABLED === 'true',
        vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
        vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
      },
      slack: {
        enabled: process.env.SLACK_ENABLED === 'true',
        token: process.env.SLACK_BOT_TOKEN,
        defaultChannel: process.env.SLACK_DEFAULT_CHANNEL,
      },
    },
    providers: {
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
      },
    },
  },
  
  queue: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
    },
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
    queues: {
      email: { concurrency: 5 },
      notifications: { concurrency: 10 },
      fileProcessing: { concurrency: 3 },
      analytics: { concurrency: 5 },
      backup: { concurrency: 1 },
      sync: { concurrency: 2 },
    },
  },
  
  backup: {
    defaultProvider: process.env.BACKUP_PROVIDER || 's3',
    schedule: {
      full: '0 2 * * 0',
      incremental: '0 2 * * *',
    },
    retention: {
      daily: 7,
      weekly: 4,
      monthly: 12,
    },
    encryption: {
      enabled: true,
      algorithm: 'aes-256-gcm',
      keyId: process.env.BACKUP_ENCRYPTION_KEY_ID,
    },
  },
  
  integration: {
    oauth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        scopes: ['email', 'profile', 'calendar'],
      },
      facebook: {
        appId: process.env.FACEBOOK_APP_ID,
        appSecret: process.env.FACEBOOK_APP_SECRET,
        redirectUri: process.env.FACEBOOK_REDIRECT_URI,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        redirectUri: process.env.GITHUB_REDIRECT_URI,
      },
    },
    webhooks: {
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 60000,
    },
  },
  
  monitoring: {
    sentry: {
      enabled: process.env.SENTRY_ENABLED === 'true',
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
    },
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED === 'true',
      port: parseInt(process.env.PROMETHEUS_PORT || '9090'),
    },
  },
};