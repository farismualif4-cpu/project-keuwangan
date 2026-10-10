import express from 'express';
import {
  getWallets,
  getWalletById,
  createWallet,
  updateWallet,
  deleteWallet
} from '../controllers/walletController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Seluruh rute dompet wajib melalui autentikasi JWT
router.use(requireAuth);

router.get('/', getWallets);
router.get('/:id', getWalletById);
router.post('/', createWallet);
router.put('/:id', updateWallet);
router.delete('/:id', deleteWallet);

export default router;
