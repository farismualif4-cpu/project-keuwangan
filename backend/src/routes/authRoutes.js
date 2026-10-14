import express from 'express';
import { register, login, refresh, logout, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { loginRateLimiter, refreshRateLimiter, verifyCsrfProtection } from '../middlewares/securityMiddleware.js';

const router = express.Router();

// Rute publik: registrasi dan login
router.post('/register', loginRateLimiter, register);
router.post('/login', loginRateLimiter, login);

// Rute manajemen sesi token cookie (HttpOnly + CSRF protected)
router.post('/refresh', refreshRateLimiter, verifyCsrfProtection, refresh);
router.post('/logout', verifyCsrfProtection, logout);

// Rute terproteksi: profil akun pengguna yang sedang login (Bearer token)
router.get('/me', requireAuth, getMe);

export default router;
