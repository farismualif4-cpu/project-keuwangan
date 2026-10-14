import express from 'express';
import { getAnalyticsSummary } from '../controllers/analyticsController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Seluruh endpoint analitik mewajibkan Bearer Token pengguna terautentikasi
router.use(authenticateToken);

// GET /api/analytics/summary - Ringkasan analitik keuangan komprehensif
router.get('/summary', getAnalyticsSummary);

export default router;
