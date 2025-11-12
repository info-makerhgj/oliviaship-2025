/**
 * Health Check Endpoint
 * للتحقق من أن السيرفر يعمل بشكل صحيح
 */

import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Basic health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      server: 'ok',
      database: 'checking...',
      memory: 'ok',
      disk: 'ok'
    }
  };

  // Check MongoDB connection
  try {
    if (mongoose.connection.readyState === 1) {
      health.checks.database = 'ok';
      health.database = {
        status: 'connected',
        host: mongoose.connection.host,
        name: mongoose.connection.name
      };
    } else {
      health.checks.database = 'error';
      health.status = 'degraded';
      health.database = {
        status: 'disconnected'
      };
    }
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'degraded';
    health.database = {
      status: 'error',
      message: error.message
    };
  }

  // Memory usage
  const memUsage = process.memoryUsage();
  health.memory = {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
  };

  // CPU usage
  const cpuUsage = process.cpuUsage();
  health.cpu = {
    user: `${Math.round(cpuUsage.user / 1000)}ms`,
    system: `${Math.round(cpuUsage.system / 1000)}ms`
  };

  res.json(health);
});

// Ping endpoint (for monitoring)
router.get('/ping', (req, res) => {
  res.send('pong');
});

export default router;
