import express from 'express';
import {
  exportTransactionsCsv,
  exportBackupJson,
  importBackupJson
} from '../controllers/dataController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Seluruh endpoint ekspor dan impor wajib terproteksi autentikasi aktif
router.use(requireAuth);

// Endpoint Ekspor
router.get('/export/csv', exportTransactionsCsv);
router.get('/export/json', exportBackupJson);

// Endpoint Impor & Pemulihan Cadangan
router.post('/import/json', importBackupJson);

export default router;
