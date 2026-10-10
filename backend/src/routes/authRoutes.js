import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rute publik: registrasi dan login
router.post('/register', register);
router.post('/login', login);

// Rute terproteksi: profil akun pengguna yang sedang login
router.get('/me', requireAuth, getMe);

export default router;
