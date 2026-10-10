import express from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Seluruh rute kategori wajib melalui autentikasi JWT
router.use(requireAuth);

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
