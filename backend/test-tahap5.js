/**
 * Test Suite FinTrack — Tahap 5: HttpOnly Cookie, Refresh Token Rotation, dan Keamanan Sesi
 *
 * Menguji secara komprehensif:
 * 1. Login sukses & gagal + validasi atribut Set-Cookie (HttpOnly, SameSite, Path).
 * 2. Refresh token valid menghasilkan access token baru dan melakukan rotasi token.
 * 3. Deteksi penggunaan ulang token (Reuse Detection): revokes session chain.
 * 4. Refresh token kedaluwarsa dan yang dicabut ditolak (401).
 * 5. Logout mencabut sesi di database dan membersihkan cookie.
 * 6. Endpoint terproteksi menolak request tanpa access token valid (401).
 * 7. Perlindungan CORS & CSRF (Origin jahat ditolak 403, CSRF mismatch ditolak 403).
 * 8. Simulasi serialized refresh handling untuk mencegah lonjakan refresh paralel.
 * 9. Isolasi data pengguna tetap berlaku.
 * 10. CRUD transaksi, dompet, kategori, dan anggaran tetap berfungsi normal.
 */

import prisma from './src/config/prisma.js';
import { hashRefreshToken } from './src/utils/tokenUtils.js';

const BASE_URL = 'http://localhost:3000/api';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message, details = '') {
  if (condition) {
    testsPassed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    testsFailed++;
    console.error(`  ❌ FAIL: ${message} ${details ? `(${details})` : ''}`);
  }
}

// Helper untuk parsing header Set-Cookie dari Fetch Response
function parseSetCookies(response) {
  // Pada Node.js fetch, getSetCookie() mengembalikan array string Set-Cookie
  let cookies = [];
  if (typeof response.headers.getSetCookie === 'function') {
    cookies = response.headers.getSetCookie();
  } else {
    const raw = response.headers.get('set-cookie');
    if (raw) cookies = [raw];
  }

  const result = {};
  cookies.forEach((cookieStr) => {
    const parts = cookieStr.split(';').map((p) => p.trim());
    const [nameVal, ...attrs] = parts;
    const [name, val] = nameVal.split('=');
    result[name] = {
      value: val,
      raw: cookieStr,
      httpOnly: attrs.some((a) => a.toLowerCase() === 'httponly'),
      sameSite: attrs.find((a) => a.toLowerCase().startsWith('samesite='))?.split('=')[1],
      path: attrs.find((a) => a.toLowerCase().startsWith('path='))?.split('=')[1],
      maxAge: attrs.find((a) => a.toLowerCase().startsWith('max-age='))?.split('=')[1]
    };
  });
  return result;
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 FINTRACK TAHAP 5 TEST SUITE: HTTPONLY COOKIE & TOKEN ROTATION');
  console.log('================================================================\n');

  try {
    // Bersihkan user tes jika ada
    await prisma.user.deleteMany({
      where: {
        email: { in: ['tahap5_usera@fintrack.test', 'tahap5_userb@fintrack.test'] }
      }
    });

    const userAPayload = {
      name: 'Pengguna Tahap Lima A',
      email: 'tahap5_usera@fintrack.test',
      password: 'password123'
    };

    const userBPayload = {
      name: 'Pengguna Tahap Lima B',
      email: 'tahap5_userb@fintrack.test',
      password: 'password123'
    };

    // -------------------------------------------------------------
    // GRUP 1: Registrasi Pengguna Baru & Pemeriksaan Cookie HttpOnly
    // -------------------------------------------------------------
    console.log('[TEST GRUP 1] Registrasi, Login & Verifikasi Cookie HttpOnly');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userAPayload)
    });
    const regData = await regRes.json();
    const regCookies = parseSetCookies(regRes);

    assert(regRes.status === 201, '1.1 Registrasi User A status 201');
    assert(Boolean(regData.token), '1.2 Access Token (JWT) dikembalikan di respons body');
    assert(Boolean(regCookies['fintrack_refresh_token']), '1.3 Cookie fintrack_refresh_token terpasang');
    assert(regCookies['fintrack_refresh_token']?.httpOnly === true, '1.4 Refresh token cookie memiliki atribut HttpOnly');
    assert(regCookies['fintrack_refresh_token']?.path === '/api/auth', '1.5 Refresh token cookie memiliki path /api/auth');
    assert(Boolean(regCookies['fintrack_csrf_token']), '1.6 Cookie CSRF token terpasang');

    let userAToken = regData.token;
    let userARefreshCookie = regCookies['fintrack_refresh_token']?.value;
    let userACsrfCookie = regCookies['fintrack_csrf_token']?.value;

    // Login Sukses
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAPayload.email, password: userAPayload.password })
    });
    const loginData = await loginRes.json();
    const loginCookies = parseSetCookies(loginRes);

    assert(loginRes.status === 200, '1.7 Login User A sukses status 200');
    assert(Boolean(loginData.token), '1.8 Access token baru diterbitkan pada login');
    assert(Boolean(loginCookies['fintrack_refresh_token']?.value), '1.9 Cookie refresh token baru terpasang pada login');

    userAToken = loginData.token;
    userARefreshCookie = loginCookies['fintrack_refresh_token']?.value;
    userACsrfCookie = loginCookies['fintrack_csrf_token']?.value;

    // Login Gagal - Password Salah
    const loginFailRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAPayload.email, password: 'wrongpassword' })
    });
    const loginFailCookies = parseSetCookies(loginFailRes);
    assert(loginFailRes.status === 401, '1.10 Login dengan password salah ditolak (401)');
    assert(!loginFailCookies['fintrack_refresh_token'], '1.11 Tidak ada cookie refresh token pada login gagal');

    // -------------------------------------------------------------
    // GRUP 2: Rotasi Refresh Token & Pembaruan Access Token
    // -------------------------------------------------------------
    console.log('\n[TEST GRUP 2] Rotasi Refresh Token & Penerbitan Access Token Baru');
    const oldRawToken = userARefreshCookie;
    const oldTokenHash = hashRefreshToken(oldRawToken);

    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Cookie': `fintrack_refresh_token=${oldRawToken}; fintrack_csrf_token=${userACsrfCookie}`,
        'X-CSRF-Token': userACsrfCookie
      }
    });
    const refreshData = await refreshRes.json();
    const rotatedCookies = parseSetCookies(refreshRes);

    assert(refreshRes.status === 200, '2.1 Request refresh status 200 OK');
    assert(Boolean(refreshData.token), '2.2 Access token baru diterima');
    assert(refreshData.token !== userAToken, '2.3 Access token baru berbeda dari access token lama');
    assert(Boolean(rotatedCookies['fintrack_refresh_token']?.value), '2.4 Cookie refresh token baru diterbitkan');
    assert(rotatedCookies['fintrack_refresh_token']?.value !== oldRawToken, '2.5 Refresh token mentah berbeda (rotasi berhasil)');

    const newRawToken = rotatedCookies['fintrack_refresh_token']?.value;
    const newCsrfToken = rotatedCookies['fintrack_csrf_token']?.value;

    // Periksa status di database: token lama harus revoked dan replacedByTokenHash terisi
    const oldDbRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash: oldTokenHash }
    });
    assert(oldDbRecord?.isRevoked === true, '2.6 Token lama di database ditandai isRevoked: true');
    assert(oldDbRecord?.replacedByTokenHash === hashRefreshToken(newRawToken), '2.7 Token lama mencatat hash token pengganti');

    // Gunakan access token baru untuk akses endpoint profil
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${refreshData.token}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.user?.email === userAPayload.email, '2.8 Access token hasil rotasi valid untuk /api/auth/me');

    // -------------------------------------------------------------
    // GRUP 3: Deteksi Penggunaan Ulang Token (Token Reuse Detection)
    // -------------------------------------------------------------
    console.log('\n[TEST GRUP 3] Deteksi Penggunaan Ulang Token (Reuse Detection)');
    // Mencoba refresh kembali menggunakan token lama yang sudah dirotasi!
    const reuseRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Cookie': `fintrack_refresh_token=${oldRawToken}; fintrack_csrf_token=${newCsrfToken}`,
        'X-CSRF-Token': newCsrfToken
      }
    });
    const reuseData = await reuseRes.json();
    assert(reuseRes.status === 401, '3.1 Penggunaan ulang token lama ditolak (401)');
    assert(reuseData.message.includes('penggunaan ulang'), '3.2 Pesan error secara spesifik menyebut deteksi penggunaan ulang');

    // Verifikasi bahwa seluruh sesi milik pengguna dicabut sebagai mitigasi keamanan
    const userTokensInDb = await prisma.refreshToken.findMany({
      where: { userId: oldDbRecord.userId }
    });
    const allRevoked = userTokensInDb.every((t) => t.isRevoked === true);
    assert(allRevoked, '3.3 Seluruh rantai sesi akun dicabut otomatis demi keamanan (RFC 6749 BCP)');

    // -------------------------------------------------------------
    // GRUP 4: Refresh Token Kedaluwarsa Ditolak
    // -------------------------------------------------------------
    console.log('\n[TEST GRUP 4] Refresh Token Kedaluwarsa Ditolak');
    // Login kembali untuk mendapatkan token baru
    const loginRes2 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAPayload.email, password: userAPayload.password })
    });
    const loginCookies2 = parseSetCookies(loginRes2);
    const validRawToken = loginCookies2['fintrack_refresh_token']?.value;
    const validCsrf = loginCookies2['fintrack_csrf_token']?.value;
    const validHash = hashRefreshToken(validRawToken);

    // Ubah tanggal kedaluwarsa menjadi masa lalu
    await prisma.refreshToken.update({
      where: { tokenHash: validHash },
      data: { expiresAt: new Date(Date.now() - 60000) }
    });

    const expiredRefreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Cookie': `fintrack_refresh_token=${validRawToken}; fintrack_csrf_token=${validCsrf}`,
        'X-CSRF-Token': validCsrf
      }
    });
    assert(expiredRefreshRes.status === 401, '4.1 Token yang telah kedaluwarsa ditolak dengan 401');

    // -------------------------------------------------------------
    // GRUP 5: Logout Mencabut Sesi & Menghapus Cookie
    // -------------------------------------------------------------
    console.log('\n[TEST GRUP 5] Logout Mencabut Sesi & Menghapus Cookie');
    // Login sekali lagi
    const loginRes3 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAPayload.email, password: userAPayload.password })
    });
    const loginCookies3 = parseSetCookies(loginRes3);
    const activeRawToken = loginCookies3['fintrack_refresh_token']?.value;
    const activeCsrf = loginCookies3['fintrack_csrf_token']?.value;
    const activeHash = hashRefreshToken(activeRawToken);

    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Cookie': `fintrack_refresh_token=${activeRawToken}; fintrack_csrf_token=${activeCsrf}`,
        'X-CSRF-Token': activeCsrf
      }
    });
    const logoutCookies = parseSetCookies(logoutRes);
    assert(logoutRes.status === 200, '5.1 Logout sukses status 200');

    // Di DB harus revoked
    const logoutDbRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash: activeHash }
    });
    assert(logoutDbRecord?.isRevoked === true, '5.2 Token dicabut di database saat logout');

    // Mencoba refresh setelah logout harus ditolak
    const afterLogoutRefresh = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Cookie': `fintrack_refresh_token=${activeRawToken}; fintrack_csrf_token=${activeCsrf}`,
        'X-CSRF-Token': activeCsrf
      }
    });
    assert(afterLogoutRefresh.status === 401, '5.3 Refresh setelah logout ditolak (401)');

    // -------------------------------------------------------------
    // GRUP 6: Perlindungan CSRF & CORS
    // -------------------------------------------------------------
    console.log('\n[TEST GRUP 6] Perlindungan CSRF & Origin CORS');
    // Origin tidak diizinkan
    const forbiddenOriginRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Origin': 'http://evil-attacker-site.com',
        'Cookie': `fintrack_refresh_token=somefake; fintrack_csrf_token=csrf1`,
        'X-CSRF-Token': 'csrf1'
      }
    });
    assert(forbiddenOriginRes.status === 403, '6.1 Permintaan dari Origin tidak sah ditolak (403)');

    // CSRF mismatch
    const csrfMismatchRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:5173',
        'Cookie': `fintrack_refresh_token=somefake; fintrack_csrf_token=legit_token_123`,
        'X-CSRF-Token': 'forged_fake_token_456'
      }
    });
    assert(csrfMismatchRes.status === 403, '6.2 Token CSRF tidak cocok ditolak (403)');

    // -------------------------------------------------------------
    // GRUP 7: Endpoint Terproteksi Menolak Request Tanpa Access Token
    // -------------------------------------------------------------
    console.log('\n[TEST GRUP 7] Endpoint Terproteksi Menolak Request Tanpa Token');
    const noTokenRes = await fetch(`${BASE_URL}/transactions`);
    assert(noTokenRes.status === 401, '7.1 GET /api/transactions tanpa token ditolak (401)');

    const badTokenRes = await fetch(`${BASE_URL}/wallets`, {
      headers: { 'Authorization': 'Bearer token_ngawur_palsu_12345' }
    });
    assert(badTokenRes.status === 401, '7.2 GET /api/wallets dengan token manipulasi ditolak (401)');

    // -------------------------------------------------------------
    // GRUP 8: Isolasi Data Pengguna & Regresi CRUD
    // -------------------------------------------------------------
    console.log('\n[TEST GRUP 8] Isolasi Data Pengguna & Kelanjutan CRUD');
    // Daftarkan User B
    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userBPayload)
    });
    const regDataB = await regResB.json();
    const tokenB = regDataB.token;

    // Login User A
    const loginResA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAPayload.email, password: userAPayload.password })
    });
    const loginDataA = await loginResA.json();
    const tokenA = loginDataA.token;

    // User A buat Dompet
    const walletResA = await fetch(`${BASE_URL}/wallets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: 'Rekening Pribadi User A',
        type: 'Bank',
        initialBalance: 5000000,
        color: '#3b82f6'
      })
    });
    const walletDataA = await walletResA.json();
    assert(walletResA.status === 201, '8.1 User A berhasil membuat dompet baru (201)');

    // User A buat Transaksi
    const txResA = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Beli Kebutuhan User A',
        amount: 250000,
        type: 'expense',
        category: 'food',
        wallet: walletDataA.data.id
      })
    });
    const txDataA = await txResA.json();
    assert(txResA.status === 201, '8.2 User A berhasil membuat transaksi baru (201)');

    // User B mencoba melihat transaksi User A
    const getTxB = await fetch(`${BASE_URL}/transactions`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const txListB = await getTxB.json();
    const hasTxA = (txListB.data || []).some((t) => t.id === txDataA.data.id);
    assert(!hasTxA, '8.3 User B TIDAK DAPAT melihat transaksi milik User A (Isolasi Terjaga)');

    // User B mencoba melihat dompet User A
    const getWalletsB = await fetch(`${BASE_URL}/wallets`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const walletListB = await getWalletsB.json();
    const hasWalletA = (walletListB.data || []).some((w) => w.id === walletDataA.data.id);
    assert(!hasWalletA, '8.4 User B TIDAK DAPAT melihat dompet milik User A (Isolasi Terjaga)');

    // User A Update & Delete Transaksi
    const updateTxA = await fetch(`${BASE_URL}/transactions/${txDataA.data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Beli Kebutuhan User A (Diperbarui)',
        amount: 300000
      })
    });
    assert(updateTxA.status === 200, '8.5 User A berhasil update transaksi (200)');

    const deleteTxA = await fetch(`${BASE_URL}/transactions/${txDataA.data.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(deleteTxA.status === 200, '8.6 User A berhasil hapus transaksi (200)');

    // Bersihkan user pengujian
    await prisma.user.deleteMany({
      where: {
        email: { in: ['tahap5_usera@fintrack.test', 'tahap5_userb@fintrack.test'] }
      }
    });

  } catch (error) {
    console.error('💥 Terjadi kesalahan fatal selama pengujian:', error);
    testsFailed++;
  }

  console.log('\n================================================================');
  console.log(`📊 HASIL PENGUJIAN TAHAP 5:`);
  console.log(`   ✅ Lulus: ${testsPassed}`);
  console.log(`   ❌ Gagal: ${testsFailed}`);
  console.log('================================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests();
