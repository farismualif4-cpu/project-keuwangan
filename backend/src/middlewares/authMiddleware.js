import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

/**
 * Middleware untuk memverifikasi token JWT dan menyematkan identitas user ke req.user
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Periksa ketersediaan header Authorization: Bearer <token>
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token autentikasi tidak ditemukan atau format tidak sesuai.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak boleh kosong.'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[AUTH ERROR] JWT_SECRET belum dikonfigurasi di file environment!');
      return res.status(500).json({
        success: false,
        message: 'Kesalahan konfigurasi autentikasi pada server.'
      });
    }

    // 2. Verifikasi tanda tangan dan masa berlaku token
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Sesi Anda telah berakhir. Silakan login kembali.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token autentikasi tidak valid atau telah dimanipulasi.'
      });
    }

    // 3. Pastikan pengguna pemilik token masih ada di database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna pemilik token sudah tidak terdaftar.'
      });
    }

    // 4. Sematkan identitas pengguna yang terverifikasi ke object request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
