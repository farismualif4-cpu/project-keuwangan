import express from 'express';
import {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
} from '../controllers/budgetController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Seluruh rute anggaran wajib melalui autentikasi JWT
router.use(requireAuth);

router.get('/', getBudgets);
router.get('/:id', getBudgetById);
router.post('/', createBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;
