import express from 'express';
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '../controllers/transactionController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Proteksi seluruh rute transaksi: Wajib menyertakan Bearer Token valid
router.use(requireAuth);

// GET /api/transactions - Daftar semua transaksi milik pengguna
router.get('/', getAllTransactions);

// GET /api/transactions/:id - Detail transaksi berdasarkan ID
router.get('/:id', getTransactionById);

// POST /api/transactions - Tambah transaksi baru
router.post('/', createTransaction);

// PUT /api/transactions/:id - Perbarui transaksi yang ada
router.put('/:id', updateTransaction);

// DELETE /api/transactions/:id - Hapus transaksi
router.delete('/:id', deleteTransaction);

export default router;
