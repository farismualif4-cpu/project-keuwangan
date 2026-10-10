// Skrip pengujian otomatis komprehensif Autentikasi & Isolasi Data FinTrack
import prisma from './src/config/prisma.js';

const BASE_URL = 'http://localhost:3000/api';

async function runAuthTests() {
  console.log('🧪 Memulai pengujian otomatis Tahap 2: Autentikasi & Keamanan Data...\n');
  let passed = 0;
  let failed = 0;

  const assert = (name, condition, details = '') => {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${details}`);
      failed++;
    }
  };

  try {
    // Bersihkan pengguna uji coba sebelumnya jika ada
    await prisma.user.deleteMany({
      where: {
        email: { in: ['usera@fintrack.test', 'userb@fintrack.test'] }
      }
    });

    // 1. Skenario 1: Registrasi pengguna baru berhasil
    console.log('--- Skenario 1: Registrasi Pengguna Baru ---');
    const userAPayload = {
      name: 'Pengguna A',
      email: 'usera@fintrack.test',
      password: 'password123'
    };
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userAPayload)
    });
    const regDataA = await regResA.json();
    assert('1. Registrasi Pengguna A status 201', regResA.status === 201);
    assert('1. Token JWT dihasilkan saat registrasi', typeof regDataA.token === 'string' && regDataA.token.length > 20);
    assert('1. Respons memuat data user (id, name, email)', regDataA.user?.email === userAPayload.email);
    const tokenA = regDataA.token;
    const userAId = regDataA.user?.id;

    // 2. Skenario 2: Registrasi email duplikat ditolak
    console.log('\n--- Skenario 2: Penolakan Email Duplikat ---');
    const regDupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userAPayload)
    });
    const regDupData = await regDupRes.json();
    assert('2. Registrasi email duplikat status 400', regDupRes.status === 400);
    assert('2. Pesan error duplikat informatif', regDupData.message.includes('sudah terdaftar'));

    // 3. Skenario 3: Input registrasi tidak valid ditolak
    console.log('\n--- Skenario 3: Validasi Input Registrasi ---');
    const invalidRegRes1 = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A', email: 'invalid-email', password: '123' })
    });
    assert('3. Registrasi password < 6 karakter / format email salah ditolak (400)', invalidRegRes1.status === 400);

    // 4. Skenario 4 & 5: Login dengan password benar & salah
    console.log('\n--- Skenario 4 & 5: Login Kredensial Benar vs Salah ---');
    const loginWrongRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'usera@fintrack.test', password: 'wrongpassword' })
    });
    assert('5. Login password salah ditolak dengan status 401', loginWrongRes.status === 401);

    const loginCorrectRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'usera@fintrack.test', password: 'password123' })
    });
    const loginDataA = await loginCorrectRes.json();
    assert('4. Login password benar berhasil dengan status 200', loginCorrectRes.status === 200);
    assert('4. Token JWT login valid diterima', typeof loginDataA.token === 'string');

    // 6. Skenario 6: Password tersimpan dalam bentuk hash (bukan plaintext)
    console.log('\n--- Skenario 6: Verifikasi Hash Password di Database ---');
    const dbUserA = await prisma.user.findUnique({ where: { id: userAId } });
    assert('6. Password tidak disimpan plaintext', dbUserA.passwordHash !== 'password123');
    assert('6. Password tersimpan dalam format bcrypt ($2a$ / $2b$)', dbUserA.passwordHash.startsWith('$2'));

    // 14. Skenario 14: Registrasi atau login tidak membocorkan password hash
    console.log('\n--- Skenario 14: Verifikasi Tidak Ada Kebocoran Password Hash ---');
    assert('14. Respons registrasi tidak memuat passwordHash', regDataA.user?.passwordHash === undefined);
    assert('14. Respons login tidak memuat passwordHash', loginDataA.user?.passwordHash === undefined);

    // 7. Skenario 7: Endpoint /api/auth/me memerlukan token yang valid
    console.log('\n--- Skenario 7: Pengujian Endpoint /api/auth/me ---');
    const meNoTokenRes = await fetch(`${BASE_URL}/auth/me`);
    assert('7. GET /api/auth/me tanpa token ditolak (401)', meNoTokenRes.status === 401);

    const meValidRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const meData = await meValidRes.json();
    assert('7. GET /api/auth/me dengan token valid status 200', meValidRes.status === 200);
    assert('7. Identitas meData sesuai dengan Pengguna A', meData.user?.email === 'usera@fintrack.test');

    // 8. Skenario 8: Request tanpa token ke endpoint transaksi ditolak setelah proteksi
    console.log('\n--- Skenario 8: Proteksi Akses Transaksi Tanpa Token ---');
    const txNoTokenRes = await fetch(`${BASE_URL}/transactions`);
    assert('8. GET /api/transactions tanpa token ditolak (401)', txNoTokenRes.status === 401);

    // 9. Skenario 9: Token tidak valid atau kedaluwarsa ditolak
    console.log('\n--- Skenario 9: Penolakan Token Rusak/Palsu ---');
    const txFakeTokenRes = await fetch(`${BASE_URL}/transactions`, {
      headers: { Authorization: 'Bearer token_palsu_random_12345' }
    });
    assert('9. Token palsu/rusak ditolak dengan status 401', txFakeTokenRes.status === 401);

    // Registrasi Pengguna B untuk pengujian isolasi multi-tenant
    console.log('\n--- Setup Pengguna B untuk Uji Multi-Tenant ---');
    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pengguna B',
        email: 'userb@fintrack.test',
        password: 'password456'
      })
    });
    const regDataB = await regResB.json();
    const tokenB = regDataB.token;

    // 15. Skenario 15: CRUD transaksi tetap berfungsi untuk pengguna yang terautentikasi
    console.log('\n--- Skenario 15: Operasi CRUD Transaksi untuk Pengguna Terautentikasi ---');
    // Pengguna A membuat transaksi A1
    const createTxARes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Gaji Proyek Pengguna A',
        amount: 8000000,
        type: 'income',
        category: 'salary',
        wallet: 'bca',
        date: '2026-10-10'
      })
    });
    const txAData = await createTxARes.json();
    assert('15. Pengguna A berhasil membuat transaksi (201)', createTxARes.status === 201);
    const txAId = txAData.data?.id;

    // Pengguna B membuat transaksi B1
    const createTxBRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        title: 'Belanja Barang Pengguna B',
        amount: 450000,
        type: 'expense',
        category: 'shopping',
        wallet: 'cash',
        date: '2026-10-10'
      })
    });
    const txBData = await createTxBRes.json();
    assert('15. Pengguna B berhasil membuat transaksi (201)', createTxBRes.status === 201);
    const txBId = txBData.data?.id;

    // 10. Skenario 10: Pengguna A hanya melihat transaksi miliknya
    console.log('\n--- Skenario 10: Isolasi Daftar Transaksi Pengguna A vs B ---');
    const listARes = await fetch(`${BASE_URL}/transactions`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const listAData = await listARes.json();
    const listBRes = await fetch(`${BASE_URL}/transactions`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const listBData = await listBRes.json();

    const aContainsB = listAData.data.some(t => t.id === txBId);
    const bContainsA = listBData.data.some(t => t.id === txAId);
    assert('10. Pengguna A TIDAK melihat transaksi milik Pengguna B', !aContainsB);
    assert('10. Pengguna B TIDAK melihat transaksi milik Pengguna A', !bContainsA);

    // 13. Skenario 13: Pengguna A tidak bisa mengambil detail transaksi milik B
    console.log('\n--- Skenario 13: Penolakan Akses Detail Transaksi Silang ---');
    const getBByARes = await fetch(`${BASE_URL}/transactions/${txBId}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert('13. Pengguna A mencoba GET transaksi milik B ditolak (404)', getBByARes.status === 404);

    // 11. Skenario 11: Pengguna A tidak bisa mengubah transaksi milik B
    console.log('\n--- Skenario 11: Penolakan Edit Transaksi Milik Pengguna Lain ---');
    const editBByARes = await fetch(`${BASE_URL}/transactions/${txBId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ title: 'Dibajak oleh Pengguna A' })
    });
    assert('11. Pengguna A mencoba PUT transaksi milik B ditolak (404)', editBByARes.status === 404);

    // 12. Skenario 12: Pengguna A tidak bisa menghapus transaksi milik B
    console.log('\n--- Skenario 12: Penolakan Hapus Transaksi Milik Pengguna Lain ---');
    const deleteBByARes = await fetch(`${BASE_URL}/transactions/${txBId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert('12. Pengguna A mencoba DELETE transaksi milik B ditolak (404)', deleteBByARes.status === 404);

    // Verifikasi Pengguna A bisa mengubah dan menghapus transaksinya sendiri
    console.log('\n--- Verifikasi Transaksi Milik Sendiri Tetap Bisa Diubah & Dihapus ---');
    const editOwnRes = await fetch(`${BASE_URL}/transactions/${txAId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ title: 'Gaji Proyek Pengguna A (Update Sukses)' })
    });
    assert('15b. Pengguna A berhasil mengupdate transaksinya sendiri (200)', editOwnRes.status === 200);

    const deleteOwnRes = await fetch(`${BASE_URL}/transactions/${txAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert('15c. Pengguna A berhasil menghapus transaksinya sendiri (200)', deleteOwnRes.status === 200);

    console.log('\n======================================================');
    console.log(`📊 RINGKASAN TEST AUTH & ISOLASI DATA: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================');
  } catch (err) {
    console.error('Fatal error saat pengujian auth:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runAuthTests();
