import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const REFRESH_COOKIE_NAME = 'fintrack_refresh_token';
export const CSRF_COOKIE_NAME = 'fintrack_csrf_token';

/**
 * Membuat Access Token JWT berumur pendek (default 15 menit)
 * @param {Object} user 
 * @returns {string} JWT Token
 */
export const generateAccessToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Konfigurasi JWT_SECRET belum tersedia di server.');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
  return jwt.sign(
    { id: user.id, email: user.email, jti: crypto.randomUUID() },
    secret,
    { expiresIn }
  );
};

/**
 * Menghasilkan raw cryptographically secure Refresh Token
 * @returns {string} 80 karakter hex string (320-bit entropy)
 */
export const generateRawRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Menghasilkan hash SHA-256 dari raw refresh token untuk disimpan di database
 * @param {string} rawToken 
 * @returns {string} 64 karakter SHA-256 hex hash
 */
export const hashRefreshToken = (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string') {
    throw new Error('Token mentah tidak valid untuk di-hash.');
  }
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

/**
 * Menghasilkan CSRF Token acak
 * @returns {string} 48 karakter hex
 */
export const generateCsrfToken = () => {
  return crypto.randomBytes(24).toString('hex');
};

/**
 * Helper untuk menentukan atribut sameSite dan secure cookie
 */
const resolveCookieSecurity = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const configuredSameSite = process.env.COOKIE_SAME_SITE?.toLowerCase();
  const sameSite = ['strict', 'lax', 'none'].includes(configuredSameSite)
    ? configuredSameSite
    : (isProd ? 'strict' : 'lax');

  // Jika sameSite === 'none', browser mewajibkan secure: true
  const configuredSecure = process.env.COOKIE_SECURE;
  const secure = configuredSecure !== undefined
    ? configuredSecure === 'true'
    : (isProd || sameSite === 'none');

  return { sameSite, secure };
};

/**
 * Opsi konfigurasi Cookie HttpOnly untuk Refresh Token
 */
export const getRefreshCookieOptions = () => {
  const { sameSite, secure } = resolveCookieSecurity();
  const expiresDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 10) || 7;
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/api/auth',
    maxAge: expiresDays * 24 * 60 * 60 * 1000 // dalam ms
  };
};

/**
 * Opsi konfigurasi Cookie untuk CSRF Token (dapat dibaca klien JS)
 */
export const getCsrfCookieOptions = () => {
  const { sameSite, secure } = resolveCookieSecurity();
  const expiresDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 10) || 7;
  return {
    httpOnly: false,
    secure,
    sameSite,
    path: '/',
    maxAge: expiresDays * 24 * 60 * 60 * 1000
  };
};

/**
 * Opsi untuk membersihkan cookie saat logout atau pencabutan sesi
 */
export const getClearCookieOptions = () => {
  const { sameSite, secure } = resolveCookieSecurity();
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/api/auth'
  };
};

export const getClearCsrfCookieOptions = () => {
  const { sameSite, secure } = resolveCookieSecurity();
  return {
    httpOnly: false,
    secure,
    sameSite,
    path: '/'
  };
};
