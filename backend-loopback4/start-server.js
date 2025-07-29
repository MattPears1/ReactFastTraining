console.log('🚀 [SERVER] Starting React Fast Training server...', {
  timestamp: new Date().toISOString(),
  nodeVersion: process.version,
  env: process.env.NODE_ENV || 'development'
});

require('dotenv').config();
console.log('✅ [SERVER] Environment variables loaded');

const { RestApplication } = require('@loopback/rest');
const { BootMixin } = require('@loopback/boot');
const { RepositoryMixin } = require('@loopback/repository');
const path = require('path');
const { Pool } = require('pg');

// Import our modular components
const { EmailService } = require('./dist/services/email.service');
const { RefundService } = require('./dist/services/refund.service');
const { setupMiddleware } = require('./config/middleware');
const { setupAdminRoutes } = require('./routes/admin');
const { setupApiRoutes } = require('./routes/api');

class BackendApplication extends BootMixin(RepositoryMixin(RestApplication)) {
  constructor(options = {}) {
    super(options);
    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}

async function main() {
  console.log('🔧 [SERVER] Initializing LoopBack application...');
  
  const app = new BackendApplication({
    rest: {
      port: process.env.PORT || 3000,
      host: process.env.HOST || 'localhost',
      gracePeriodForClose: 5000,
      openApiSpec: {
        setServersFromRequest: true,
      },
    },
  });

  // Boot the application (this loads controllers, etc.)
  await app.boot();
  
  // Start the LoopBack server
  await app.start();

  // Get the Express app instance for additional middleware and routes
  console.log('🔧 [SERVER] Getting Express app instance...');
  const restServer = await app.getServer('RestServer');
  console.log('🔧 [SERVER] RestServer:', typeof restServer, restServer?.constructor?.name);
  console.log('🔧 [SERVER] RestServer properties:', Object.keys(restServer || {}));
  
  // Try different ways to get the Express app
  const expressApp = restServer.expressApp || restServer.requestHandler || restServer.httpServer?.expressApp;
  console.log('✅ [SERVER] Express app instance:', typeof expressApp, expressApp?.constructor?.name);

  // Initialize services
  console.log('🔧 [SERVER] Initializing services...');
  const emailService = new EmailService();
  const refundService = new RefundService();
  console.log('✅ [SERVER] Services initialized');

  // Setup database connection
  console.log('🗄️ [DATABASE] Connecting to PostgreSQL...');
  const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('heroku') || process.env.DATABASE_URL?.includes('amazonaws') ? 
      { rejectUnauthorized: false } : false
  });

  try {
    await db.query('SELECT NOW()');
    console.log('✅ [DATABASE] PostgreSQL connected successfully');
  } catch (error) {
    console.error('❌ [DATABASE] Failed to connect to PostgreSQL:', error);
    process.exit(1);
  }

  // Setup middleware (security, sessions, static files)
  if (!expressApp || typeof expressApp.use !== 'function') {
    console.error('❌ [SERVER] Express app is not valid:', expressApp);
    process.exit(1);
  }
  setupMiddleware(expressApp);

  // Setup admin routes
  setupAdminRoutes(expressApp, db);

  // Setup public API routes
  setupApiRoutes(expressApp, db, emailService);

  // Add HTTPS redirect middleware for production
  expressApp.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
      console.log('🔐 [HTTPS] Redirecting to HTTPS:', {
        host: req.header('host'),
        url: req.url,
        timestamp: new Date().toISOString()
      });
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });

  // Catch-all handler for SPA routing
  expressApp.get('*', (req, res) => {
    const staticPath = path.join(__dirname, '..', 'dist');
    res.sendFile(path.join(staticPath, 'index.html'), (err) => {
      if (err) {
        console.error('❌ [STATIC] Error serving index.html:', err);
        res.status(500).send('Internal Server Error');
      }
    });
  });

  const url = app.restServer.url;
  console.log(`🚀 Server is running at ${url}`);
  console.log(`📡 Try ${url}/ping`);
  console.log('✅ [SERVER] React Fast Training server started successfully');

  return app;
}

main().catch(err => {
  console.error('❌ Cannot start the application.', err);
  process.exit(1);
});