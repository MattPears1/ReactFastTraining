import {ApplicationConfig, ReactFastTrainingApiApplication} from './application';
import {websocketService} from './services/websocket.service';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export * from './application';

export async function main(options: ApplicationConfig = {}) {
  console.log('=== BACKEND STARTING ===');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Port:', process.env.PORT || 3000);
  console.log('Frontend URL:', process.env.FRONTEND_URL || 'http://localhost:5173');
  console.log('Stripe Secret Key exists:', !!process.env.STRIPE_SECRET_KEY);
  console.log('Stripe Publishable Key exists:', !!process.env.STRIPE_PUBLISHABLE_KEY);
  
  const app = new ReactFastTrainingApiApplication(options);
  await app.boot();
  await app.start();

  // Initialize WebSocket server
  const server = app.restServer.httpServer?.server;
  if (server) {
    await websocketService.initialize(server);
    console.log('WebSocket server initialized');
  }

  const url = app.restServer.url;
  console.log(`=== SERVER RUNNING ===`);
  console.log(`Server URL: ${url}`);
  console.log(`API Base: ${url}/api`);
  console.log(`Health Check: ${url}/ping`);
  console.log(`Payment Endpoint: ${url}/api/bookings/create-payment-intent`);

  return app;
}

if (require.main === module) {
  // Run the application
  const config = {
    rest: {
      port: +(process.env.PORT ?? 3000),
      host: process.env.HOST,
      // The `gracePeriodForClose` provides a graceful close for http/https
      // servers with keep-alive clients. The default value is `Infinity`
      // (don't force-close). If you want to immediately destroy all sockets
      // upon stop, set its value to `0`.
      // See https://www.npmjs.com/package/stoppable
      gracePeriodForClose: 5000, // 5 seconds
      openApiSpec: {
        // useful when used with OpenAPI-to-GraphQL to locate your application
        setServersFromRequest: true,
      },
      // Enable CORS for cross-origin requests
      cors: {
        origin: [
          'https://www.reactfasttraining.co.uk',
          'https://reactfasttraining.co.uk',
          'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:3000'
        ],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-API-Key'
      }
    },
  };
  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}