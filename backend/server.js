import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import healthRoutes from './src/routes/healthRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import transactionRoutes from './src/routes/transactionRoutes.js';
import walletRoutes from './src/routes/walletRoutes.js';
import budgetRoutes from './src/routes/budgetRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import dataRoutes from './src/routes/dataRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import { seedSystemCategories } from './src/config/seedCategories.js';
import { errorHandler, notFoundHandler } from './src/middlewares/errorHandler.js';
import prisma from './src/config/prisma.js';

// Muat konfigurasi dari berkas .env
dotenv.config();

// Validasi konfigurasi keamanan wajib sebelum menjalankan server
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length === 0) {
  console.error('[FATAL SECURITY ERROR] Konfigurasi JWT_SECRET wajib tersedia di environment variables.');
  console.error('[FATAL SECURITY ERROR] Server tidak dapat dijalankan tanpa kunci rahasia autentikasi yang aman.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Konfigurasi Middleware CORS
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175'
];
app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (seperti Postman, curl, skrip testing) atau port lokal development
    if (!origin || allowedOrigins.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    const err = new Error(`CORS blocked: Origin ${origin} not allowed`);
    err.statusCode = 403;
    return callback(err);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']
}));

// 2. Parser JSON Body & Cookies
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// 3. Logger Sederhana untuk Request Masuk (Development)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// 4. Daftarkan Rute API
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root greeting endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Selamat datang di API FinTrack 💰',
    healthCheck: '/api/health',
    authEndpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      refresh: 'POST /api/auth/refresh (HttpOnly Cookie)',
      logout: 'POST /api/auth/logout (HttpOnly Cookie)',
      me: 'GET /api/auth/me'
    },
    dataEndpoints: {
      exportCsv: 'GET /api/data/export/csv',
      exportJson: 'GET /api/data/export/json',
      importJson: 'POST /api/data/import/json'
    },
    analyticsEndpoint: '/api/analytics/summary (Protected)',
    transactionsEndpoint: '/api/transactions (memerlukan Bearer Token)'
  });
});

// 5. Penanganan Rute Tidak Ditemukan (404)
app.use(notFoundHandler);

// 6. Penanganan Error Global (500 / custom)
app.use(errorHandler);

// 7. Jalankan Server
const server = app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`🚀 FinTrack Server berjalan di http://localhost:${PORT}`);
  console.log(`🩺 Health check : http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth API     : http://localhost:${PORT}/api/auth`);
  console.log(`💳 Transaksi API: http://localhost:${PORT}/api/transactions (Protected)`);
  console.log(`🏷️ Kategori API : http://localhost:${PORT}/api/categories (Protected)`);
  console.log(`💼 Dompet API   : http://localhost:${PORT}/api/wallets (Protected)`);
  console.log(`📊 Anggaran API : http://localhost:${PORT}/api/budgets (Protected)`);
  console.log(`📈 Analitik API : http://localhost:${PORT}/api/analytics (Protected)`);
  console.log(`💾 Data API     : http://localhost:${PORT}/api/data (Protected)`);
  console.log(`===============================================`);
  try {
    await seedSystemCategories();
  } catch (err) {
    console.error('[SEED] Gagal seed kategori sistem otomatis:', err.message);
  }
});

// Penanganan Graceful Shutdown
const handleShutdown = async (signal) => {
  console.log(`\n[SHUTDOWN] Menerima sinyal ${signal}, menutup server dengan aman...`);
  server.close(async () => {
    console.log('[SHUTDOWN] Server HTTP ditutup.');
    await prisma.$disconnect();
    console.log('[SHUTDOWN] Koneksi database diputus.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export default app;
