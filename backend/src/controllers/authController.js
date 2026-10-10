import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

/**
 * Helper untuk membuat Access Token JWT
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Konfigurasi JWT_SECRET belum tersedia di server.');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    { id: user.id, email: user.email },
    secret,
    { expiresIn }
  );
};

/**
 * 1. POST /api/auth/register - Registrasi Pengguna Baru
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // --- Validasi Input ---
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Nama lengkap wajib diisi (minimal 2 karakter).'
      });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email wajib diisi.'
      });
    }

    // Normalisasi email
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid.'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password wajib diisi (minimal 6 karakter).'
      });
    }

    // --- Cek Keunikan Email ---
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.'
      });
    }

    // --- Hash Password ---
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // --- Simpan Pengguna ke Database ---
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    // Buat JWT Token
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Registrasi akun berhasil!',
      token,
      user: newUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. POST /api/auth/login - Login Pengguna & Penerbitan Token
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // --- Validasi Input ---
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Cari pengguna berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Gunakan pesan error umum agar tidak membocorkan keberadaan akun
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.'
      });
    }

    // Periksa password menggunakan fungsi verifikasi bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.'
      });
    }

    // Buat JWT Token
    const token = generateToken(user);

    // Siapkan object user aman (tanpa passwordHash)
    const userSafe = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: 'Login berhasil!',
      token,
      user: userSafe
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET /api/auth/me - Cek Sesi Pengguna Aktif
 */
export const getMe = async (req, res) => {
  // req.user sudah diverifikasi dan disematkan oleh middleware requireAuth
  res.status(200).json({
    success: true,
    message: 'Sesi pengguna valid.',
    user: req.user
  });
};
