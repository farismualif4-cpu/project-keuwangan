import { CSRF_COOKIE_NAME } from '../utils/tokenUtils.js';

/**
 * Daftar origin yang diizinkan untuk verifikasi Origin / Referer
 */
const getAllowedOrigins = () => {
  return [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000'
  ].filter(Boolean);
};

/**
 * Middleware Perlindungan CSRF:
 * 1. Memeriksa header Origin/Referer jika dikirimkan oleh browser
 * 2. Memeriksa Double Submit Cookie (Header X-CSRF-Token harus cocok dengan cookie fintrack_csrf_token)
 */
export const verifyCsrfProtection = (req, res, next) => {
  // Hanya periksa pada metode mutasi yang mengandalkan sesi cookie
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    const allowed = getAllowedOrigins();

    // 1. Verifikasi Origin jika tersedia
    if (origin) {
      const isOriginAllowed = allowed.some((allowedOrigin) => origin === allowedOrigin);
      if (!isOriginAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Permintaan ditolak: Origin tidak sah (Pelanggaran CORS/CSRF).'
        });
      }
    } else if (referer) {
      // Verifikasi Referer jika Origin tidak dikirim (misal browser lama)
      try {
        const refererUrl = new URL(referer);
        const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
        const isRefererAllowed = allowed.some((allowedOrigin) => refererOrigin === allowedOrigin);
        if (!isRefererAllowed) {
          return res.status(403).json({
            success: false,
            message: 'Permintaan ditolak: Referer tidak sah (Pelanggaran CORS/CSRF).'
          });
        }
      } catch {
        return res.status(403).json({
          success: false,
          message: 'Format Referer tidak valid.'
        });
      }
    }

    // 2. Double-Submit Cookie CSRF Check (Jika cookie CSRF terpasang pada request)
    const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
    if (csrfCookie) {
      const csrfHeader = req.headers['x-csrf-token'];
      if (!csrfHeader || csrfHeader !== csrfCookie) {
        return res.status(403).json({
          success: false,
          message: 'Permintaan ditolak: Token CSRF tidak valid atau tidak cocok.'
        });
      }
    }
  }

  next();
};

/**
 * In-Memory Rate Limiter Sederhana untuk Perlindungan Endpoint Sensitif
 */
class InMemoryRateLimiter {
  constructor(windowMs = 15 * 60 * 1000, maxRequests = 20) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.records = new Map();

    // Pembersihan berkala memori setiap 5 menit
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.records.entries()) {
        if (now - record.startTime > this.windowMs) {
          this.records.delete(key);
        }
      }
    }, 5 * 60 * 1000).unref();
  }

  middleware() {
    return (req, res, next) => {
      // Dapatkan IP klien
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const now = Date.now();

      let record = this.records.get(ip);
      if (!record || now - record.startTime > this.windowMs) {
        record = { count: 1, startTime: now };
        this.records.set(ip, record);
      } else {
        record.count++;
      }

      if (record.count > this.maxRequests) {
        return res.status(429).json({
          success: false,
          message: 'Terlalu banyak permintaan. Silakan tunggu beberapa saat sebelum mencoba kembali.'
        });
      }

      next();
    };
  }
}

export const loginRateLimiter = new InMemoryRateLimiter(15 * 60 * 1000, 30).middleware();
export const refreshRateLimiter = new InMemoryRateLimiter(15 * 60 * 1000, 60).middleware();
