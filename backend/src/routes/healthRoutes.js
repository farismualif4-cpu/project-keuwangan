import express from 'express';
import prisma from '../config/prisma.js';

const router = express.Router();

// GET /api/health - Endpoint cek kesehatan server dan koneksi database
router.get('/', async (req, res) => {
  let dbStatus = 'Disconnected';
  let dbError = null;

  try {
    // Uji koneksi database fisik dengan query ringan
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'Connected';
  } catch (err) {
    dbError = err.message;
  }

  const isHealthy = dbStatus === 'Connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'DEGRADED',
    service: 'FinTrack Backend API',
    uptime: `${Math.floor(process.uptime())} detik`,
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      type: 'SQLite (Prisma ORM)',
      ...(dbError && { error: dbError })
    }
  });
});

export default router;
