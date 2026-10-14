import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import {
  generateAccessToken,
  generateRawRefreshToken,
  hashRefreshToken,
  generateCsrfToken,
  REFRESH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  getRefreshCookieOptions,
  getCsrfCookieOptions,
  getClearCookieOptions,
  getClearCsrfCookieOptions
} from '../utils/tokenUtils.js';

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

    // 1. Buat Access Token JWT (umur pendek 15m)
    const token = generateAccessToken(newUser);

    // 2. Buat Refresh Token (umur 7 hari) dan simpan hash di database
    const rawRefreshToken = generateRawRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const expiresDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 10) || 7;
    const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: newUser.id,
        expiresAt
      }
    });

    // 3. Pasang Cookie HttpOnly untuk Refresh Token & Cookie CSRF Token
    const csrfToken = generateCsrfToken();
    res.cookie(REFRESH_COOKIE_NAME, rawRefreshToken, getRefreshCookieOptions());
    res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());

    res.status(201).json({
      success: true,
      message: 'Registrasi akun berhasil!',
      token,
      csrfToken,
      user: newUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. POST /api/auth/login - Login Pengguna & Penerbitan Sesi
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

    // 1. Buat Access Token JWT
    const token = generateAccessToken(user);

    // 2. Buat Refresh Token & Simpan Hash ke DB
    const rawRefreshToken = generateRawRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const expiresDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 10) || 7;
    const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt
      }
    });

    // 3. Pasang Cookie HttpOnly untuk Refresh Token & Cookie CSRF Token
    const csrfToken = generateCsrfToken();
    res.cookie(REFRESH_COOKIE_NAME, rawRefreshToken, getRefreshCookieOptions());
    res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());

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
      csrfToken,
      user: userSafe
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /api/auth/refresh - Rotasi Refresh Token & Pembaruan Access Token
 */
export const refresh = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token tidak ditemukan pada cookie.'
      });
    }

    const incomingHash = hashRefreshToken(rawRefreshToken);

    // Cari sesi token di database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash: incomingHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        }
      }
    });

    // Jika token tidak ditemukan di DB
    if (!tokenRecord) {
      res.clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions());
      res.clearCookie(CSRF_COOKIE_NAME, getClearCsrfCookieOptions());
      return res.status(401).json({
        success: false,
        message: 'Refresh token tidak valid atau tidak dikenali.'
      });
    }

    // DETEKSI PENGGUNAAN ULANG TOKEN (REUSE DETECTION):
    // Jika token sudah pernah dicabut atau sudah pernah digantikan token baru
    if (tokenRecord.isRevoked || tokenRecord.replacedByTokenHash) {
      // Cabut seluruh rantai sesi untuk akun ini sebagai mitigasi keamanan (RFC 6749 BCP)
      await prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId },
        data: {
          isRevoked: true,
          revokedAt: new Date()
        }
      });

      res.clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions());
      res.clearCookie(CSRF_COOKIE_NAME, getClearCsrfCookieOptions());

      return res.status(401).json({
        success: false,
        message: 'Terdeteksi penggunaan ulang token yang tidak sah. Seluruh sesi akun telah dicabut demi keamanan. Silakan login kembali.'
      });
    }

    // Periksa apakah token sudah kedaluwarsa
    if (new Date() > new Date(tokenRecord.expiresAt)) {
      await prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: {
          isRevoked: true,
          revokedAt: new Date()
        }
      });

      res.clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions());
      res.clearCookie(CSRF_COOKIE_NAME, getClearCsrfCookieOptions());

      return res.status(401).json({
        success: false,
        message: 'Sesi telah kedaluwarsa. Silakan login kembali.'
      });
    }

    // TOKEN VALID: Lakukan rotasi token secara atomik
    const newRawRefreshToken = generateRawRefreshToken();
    const newHash = hashRefreshToken(newRawRefreshToken);
    const expiresDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 10) || 7;
    const newExpiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          replacedByTokenHash: newHash
        }
      }),
      prisma.refreshToken.create({
        data: {
          tokenHash: newHash,
          userId: tokenRecord.userId,
          expiresAt: newExpiresAt
        }
      })
    ]);

    // Terbitkan Access Token baru
    const newAccessToken = generateAccessToken(tokenRecord.user);
    const newCsrfToken = generateCsrfToken();

    // Pasang cookie baru
    res.cookie(REFRESH_COOKIE_NAME, newRawRefreshToken, getRefreshCookieOptions());
    res.cookie(CSRF_COOKIE_NAME, newCsrfToken, getCsrfCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Sesi berhasil diperbarui.',
      token: newAccessToken,
      csrfToken: newCsrfToken,
      user: tokenRecord.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. POST /api/auth/logout - Pencabutan Sesi & Pembersihan Cookie
 */
export const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (rawRefreshToken && typeof rawRefreshToken === 'string') {
      try {
        const hash = hashRefreshToken(rawRefreshToken);
        await prisma.refreshToken.updateMany({
          where: {
            tokenHash: hash,
            isRevoked: false
          },
          data: {
            isRevoked: true,
            revokedAt: new Date()
          }
        });
      } catch {
        // Abaikan error database pada saat logout agar cookie tetap dibersihkan
      }
    }

    // Bersihkan cookie di browser
    res.clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions());
    res.clearCookie(CSRF_COOKIE_NAME, getClearCsrfCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Logout berhasil. Sesi telah dicabut dan cookie dibersihkan.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. GET /api/auth/me - Cek Sesi Pengguna Aktif
 */
export const getMe = async (req, res) => {
  // req.user sudah diverifikasi dan disematkan oleh middleware requireAuth
  res.status(200).json({
    success: true,
    message: 'Sesi pengguna valid.',
    user: req.user
  });
};
