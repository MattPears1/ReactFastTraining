console.log('🚀 [SERVER] Starting React Fast Training server...', {
  timestamp: new Date().toISOString(),
  nodeVersion: process.version,
  env: process.env.NODE_ENV || 'development'
});

require('dotenv').config();
console.log('✅ [SERVER] Environment variables loaded');

const { ReactFastTrainingApiApplication } = require('./dist/application');

async function main() {
  const app = new ReactFastTrainingApiApplication({
    rest: {
      port: process.env.PORT || 3000,
      host: process.env.HOST || 'localhost',
      gracePeriodForClose: 5000,
      openApiSpec: {
        setServersFromRequest: true,
      },
      cors: {
        origin: [
          'http://localhost:8081',
          'http://192.168.0.84:8081',
          'https://www.reactfasttraining.co.uk',
          'https://reactfasttraining.co.uk'
        ],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-API-Key'
      }
    },
  });

  await app.boot();
  await app.start();

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