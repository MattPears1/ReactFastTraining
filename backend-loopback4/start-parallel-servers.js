#!/usr/bin/env node

/**
 * Parallel Server Runner for Express to LoopBack 4 Migration
 * This script runs both Express and LoopBack 4 servers simultaneously
 * allowing for gradual migration of endpoints.
 */

const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');

// Configuration
const EXPRESS_PORT = process.env.EXPRESS_PORT || 3002;
const LOOPBACK_PORT = process.env.LOOPBACK_PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(chalk.blue('================================='));
console.log(chalk.blue('React Fast Training Migration Tool'));
console.log(chalk.blue('================================='));
console.log(chalk.yellow(`Environment: ${NODE_ENV}`));
console.log(chalk.yellow(`Express Port: ${EXPRESS_PORT}`));
console.log(chalk.yellow(`LoopBack Port: ${LOOPBACK_PORT}`));
console.log(chalk.blue('=================================\n'));

// Shared environment variables
const sharedEnv = {
  ...process.env,
  NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
};

// Start Express server
console.log(chalk.green('[Express] Starting server...'));
const expressServer = spawn('node', [path.join(__dirname, '..', 'server.js')], {
  env: {
    ...sharedEnv,
    PORT: EXPRESS_PORT,
    SERVER_TYPE: 'express'
  },
  stdio: ['inherit', 'pipe', 'pipe']
});

expressServer.stdout.on('data', (data) => {
  process.stdout.write(chalk.green(`[Express] ${data}`));
});

expressServer.stderr.on('data', (data) => {
  process.stderr.write(chalk.red(`[Express ERROR] ${data}`));
});

expressServer.on('error', (error) => {
  console.error(chalk.red(`[Express] Failed to start: ${error.message}`));
  process.exit(1);
});

// Start LoopBack 4 server
console.log(chalk.blue('[LoopBack] Building and starting server...'));
const loopbackServer = spawn('npm', ['run', 'start'], {
  cwd: path.join(__dirname),
  env: {
    ...sharedEnv,
    PORT: LOOPBACK_PORT,
    SERVER_TYPE: 'loopback',
    HOST: '0.0.0.0'
  },
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

loopbackServer.stdout.on('data', (data) => {
  process.stdout.write(chalk.blue(`[LoopBack] ${data}`));
});

loopbackServer.stderr.on('data', (data) => {
  process.stderr.write(chalk.red(`[LoopBack ERROR] ${data}`));
});

loopbackServer.on('error', (error) => {
  console.error(chalk.red(`[LoopBack] Failed to start: ${error.message}`));
  process.exit(1);
});

// Health check function
const healthCheck = async () => {
  const fetch = require('node-fetch');
  
  try {
    // Check Express health
    const expressHealth = await fetch(`http://localhost:${EXPRESS_PORT}/health`);
    if (expressHealth.ok) {
      console.log(chalk.green(`✓ Express server healthy on port ${EXPRESS_PORT}`));
    }
    
    // Check LoopBack health
    const loopbackHealth = await fetch(`http://localhost:${LOOPBACK_PORT}/ping`);
    if (loopbackHealth.ok) {
      console.log(chalk.blue(`✓ LoopBack server healthy on port ${LOOPBACK_PORT}`));
    }
  } catch (error) {
    console.log(chalk.yellow('⚠ Servers still starting up...'));
  }
};

// Perform health checks after startup
setTimeout(() => {
  healthCheck();
  setInterval(healthCheck, 60000); // Check every minute
}, 10000);

// Graceful shutdown
const shutdown = (signal) => {
  console.log(chalk.yellow(`\n${signal} received. Shutting down servers...`));
  
  expressServer.kill('SIGTERM');
  loopbackServer.kill('SIGTERM');
  
  setTimeout(() => {
    console.log(chalk.red('Force killing servers...'));
    expressServer.kill('SIGKILL');
    loopbackServer.kill('SIGKILL');
    process.exit(0);
  }, 5000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Monitor server crashes and restart
expressServer.on('exit', (code, signal) => {
  console.log(chalk.red(`[Express] Server exited with code ${code} and signal ${signal}`));
  if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGKILL') {
    console.log(chalk.yellow('[Express] Restarting in 5 seconds...'));
    setTimeout(() => {
      // Restart logic here
    }, 5000);
  }
});

loopbackServer.on('exit', (code, signal) => {
  console.log(chalk.red(`[LoopBack] Server exited with code ${code} and signal ${signal}`));
  if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGKILL') {
    console.log(chalk.yellow('[LoopBack] Restarting in 5 seconds...'));
    setTimeout(() => {
      // Restart logic here
    }, 5000);
  }
});

// Migration status endpoint
const express = require('express');
const statusApp = express();
const STATUS_PORT = 3003;

statusApp.get('/migration/status', (req, res) => {
  res.json({
    status: 'active',
    phase: 'parallel_running',
    servers: {
      express: {
        port: EXPRESS_PORT,
        status: expressServer.killed ? 'stopped' : 'running'
      },
      loopback: {
        port: LOOPBACK_PORT,
        status: loopbackServer.killed ? 'stopped' : 'running'
      }
    },
    startTime: new Date().toISOString()
  });
});

statusApp.listen(STATUS_PORT, () => {
  console.log(chalk.magenta(`\n📊 Migration status available at http://localhost:${STATUS_PORT}/migration/status\n`));
});