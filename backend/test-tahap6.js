/**
 * Test Suite FinTrack — Tahap 6: Export & Import Data FinTrack
 *
 * Menguji secara komprehensif:
 * 1. Export Transaksi ke CSV:
 *    - Autentikasi dan isolasi data pengguna aktif.
 *    - Format header, UTF-8 BOM, tanggal, nominal, dan pemisah koma/tanda kutip.
 *    - Pencegahan CSV Formula Injection (CWE-1236) pada karakter =, +, -, @.
 *    - Filter tanggal, tipe, kategori, dompet, dan pencarian.
 * 2. Export Cadangan JSON:
 *    - Struktur versi, metadata, ringkasan, dan relasi data.
 *    - Sanitasi data: Zero Secret Leak (tanpa passwordHash, token, atau secret).
 *    - Isolasi kepemilikan antar-pengguna.
 * 3. Import & Pemulihan Cadangan JSON:
 *    - Validasi struktur, tipe data, tanggal, dan nominal non-negatif.
 *    - Penolakan file rusak atau data melebihi batas kuota.
 *    - Pencegahan ID spoofing (pemilik selalu pengguna yang login).
 *    - Validasi dan penanganan referensi dompet dan kategori.
 *    - Mode 'merge' (gabung) vs 'replace' (ganti).
 *    - Transaksi atomik Prisma: rollback penuh saat validasi gagal di tengah pemulihan.
 */

import prisma from './src/config/prisma.js';

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

async function runTests() {
  console.log('================================================================');
  console.log('🧪 FINTRACK TAHAP 6 TEST SUITE: EXPORT & IMPORT DATA');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // SETUP: Bersihkan dan Siapkan Pengguna Tes User A & User B
    // -------------------------------------------------------------
    console.log('[SETUP] Membersihkan & Mendaftarkan Pengguna Tes...');
    await prisma.user.deleteMany({
      where: {
        email: { in: ['tahap6_usera@fintrack.test', 'tahap6_userb@fintrack.test'] }
      }
    });

    // Registrasi User A
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pengguna Tahap 6 A',
        email: 'tahap6_usera@fintrack.test',
        password: 'password123'
      })
    });
    const regDataA = await regResA.json();
    const tokenA = regDataA.token;
    const userA = regDataA.user;

    // Registrasi User B
    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pengguna Tahap 6 B',
        email: 'tahap6_userb@fintrack.test',
        password: 'password123'
      })
    });
    const regDataB = await regResB.json();
    const tokenB = regDataB.token;
    const userB = regDataB.user;

    assert(Boolean(tokenA && userA?.id), 'Setup: User A terdaftar dengan token');
    assert(Boolean(tokenB && userB?.id), 'Setup: User B terdaftar dengan token');

    // Buat Dompet untuk User A
    const walletResA = await fetch(`${BASE_URL}/wallets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: 'Dompet Utama User A',
        type: 'bank',
        initialBalance: 5000000,
        color: '#6366f1'
      })
    });
    const walletDataA = await walletResA.json();
    const walletAId = walletDataA.data?.id;

    // Buat Kategori Kustom untuk User A
    const catResA = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: 'Investasi Khusus A',
        type: 'expense',
        color: '#10b981',
        icon: 'TrendingUp'
      })
    });
    const catDataA = await catResA.json();
    const catAId = catDataA.data?.id;

    // Buat Transaksi untuk User A
    const tx1Res = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Gaji Bulanan',
        amount: 10000000,
        type: 'income',
        categoryId: 'salary',
        walletId: walletAId,
        date: '2026-10-01'
      })
    });

    const tx2Res = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Makan Malam "Keluarga", Lezat!',
        amount: 350000,
        type: 'expense',
        categoryId: 'food',
        walletId: walletAId,
        date: '2026-10-05',
        notes: 'Catatan dengan tanda kutip "ganda" dan koma, aman'
      })
    });

    // Transaksi dengan Potensi Formula Injection
    const tx3Res = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: '=SUM(A1:A100)',
        amount: 125000,
        type: 'expense',
        categoryId: catAId,
        walletId: walletAId,
        date: '2026-10-10',
        notes: '@admin +calc|cmd'
      })
    });

    // Buat Transaksi untuk User B (Data Isolasi)
    const txBRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        title: 'Rahasia User B Jangan Bocor',
        amount: 9999999,
        type: 'income',
        categoryId: 'salary',
        walletId: 'cash',
        date: '2026-10-02'
      })
    });

    assert(tx1Res.status === 201 && tx2Res.status === 201 && tx3Res.status === 201, 'Setup: Transaksi User A berhasil dibuat');
    assert(txBRes.status === 201, 'Setup: Transaksi User B berhasil dibuat');

    // -------------------------------------------------------------
    // GRUP 1: EXPORT TRANSAKSI KE CSV
    // -------------------------------------------------------------
    console.log('\n[TEST GRUP 1] Export Transaksi ke CSV & Mitigasi Formula Injection');

    // 1.1 Akses tanpa autentikasi ditolak
    const unauthCsvRes = await fetch(`${BASE_URL}/data/export/csv`);
    assert(unauthCsvRes.status === 401, '1.1 Export CSV tanpa token ditolak status 401');

    // 1.2 Export CSV milik User A
    const csvResA = await fetch(`${BASE_URL}/data/export/csv`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(csvResA.status === 200, '1.2 Export CSV User A status 200 OK');

    const csvContentType = csvResA.headers.get('content-type');
    const csvDisposition = csvResA.headers.get('content-disposition');
    assert(csvContentType.includes('text/csv'), '1.3 Content-Type berformat text/csv', csvContentType);
    assert(csvDisposition.includes('attachment') && csvDisposition.includes('.csv'), '1.4 Content-Disposition attachment .csv', csvDisposition);

    const csvBufferA = Buffer.from(await csvResA.arrayBuffer());
    // UTF-8 BOM byte sequence adalah 0xEF, 0xBB, 0xBF
    const hasBom = csvBufferA[0] === 0xEF && csvBufferA[1] === 0xBB && csvBufferA[2] === 0xBF;
    assert(hasBom, '1.5 CSV memiliki UTF-8 BOM (0xEF, 0xBB, 0xBF) untuk kompatibilitas Excel');

    const csvTextA = csvBufferA.toString('utf-8');
    assert(
      csvTextA.includes('"ID"') &&
      csvTextA.includes('"Tanggal"') &&
      csvTextA.includes('"Judul"') &&
      csvTextA.includes('"Tipe"') &&
      csvTextA.includes('"Kategori"') &&
      csvTextA.includes('"Nominal"'),
      '1.6 Header kolom CSV lengkap dan sesuai urutan'
    );

    // 1.7 Isolasi Data Pengguna
    assert(csvTextA.includes('Gaji Bulanan') && csvTextA.includes('Makan Malam'), '1.7 Data User A ada dalam CSV');
    assert(!csvTextA.includes('Rahasia User B Jangan Bocor'), '1.8 Data transaksi User B TIDAK bocor ke CSV User A');

    // 1.9 Karakter Khusus & Escaping
    assert(csvTextA.includes('"Makan Malam ""Keluarga"", Lezat!"'), '1.9 Tanda kutip ganda dan koma diescape dengan aman');
    assert(csvTextA.includes('"Catatan dengan tanda kutip ""ganda"" dan koma, aman"'), '1.10 Catatan berkoma dan berkutip diescape dengan aman');

    // 1.11 Mitigasi Formula Injection (CWE-1236)
    assert(csvTextA.includes("''=SUM(A1:A100)") || csvTextA.includes("'=SUM(A1:A100)"), '1.11 Karakter formula = diawali tanda petik tunggal perlindungan spreadsheet');
    assert(csvTextA.includes("'@admin +calc|cmd"), '1.12 Karakter berbahaya @ diawali tanda petik tunggal');

    // 1.13 Filter Dinamis pada Export CSV
    const csvIncomeRes = await fetch(`${BASE_URL}/data/export/csv?type=income`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const csvIncomeText = await csvIncomeRes.text();
    assert(csvIncomeText.includes('Gaji Bulanan'), '1.13 Filter type=income memuat Gaji Bulanan');
    assert(!csvIncomeText.includes('Makan Malam'), '1.14 Filter type=income tidak memuat Makan Malam (expense)');

    const csvSearchRes = await fetch(`${BASE_URL}/data/export/csv?search=Lezat`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const csvSearchText = await csvSearchRes.text();
    assert(csvSearchText.includes('Makan Malam') && !csvSearchText.includes('Gaji Bulanan'), '1.15 Filter search=Lezat hanya mengembalikan data yang cocok');

    // -------------------------------------------------------------
    // GRUP 2: EXPORT CADANGAN JSON (ZERO SECRET LEAK)
    // -------------------------------------------------------------
    console.log('\n[TEST GRUP 2] Export Cadangan JSON & Sanitasi Rahasia Autentikasi');

    // 2.1 Akses tanpa autentikasi ditolak
    const unauthJsonRes = await fetch(`${BASE_URL}/data/export/json`);
    assert(unauthJsonRes.status === 401, '2.1 Export JSON tanpa token ditolak status 401');

    // 2.2 Export JSON User A
    const jsonResA = await fetch(`${BASE_URL}/data/export/json`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(jsonResA.status === 200, '2.2 Export JSON User A status 200 OK');

    const backupDataA = await jsonResA.json();
    assert(backupDataA.success === true, '2.3 Response JSON memiliki success: true');
    assert(backupDataA.version === '1.0', '2.4 Versi cadangan tertera 1.0');
    assert(Boolean(backupDataA.exportedAt), '2.5 Timestamp exportedAt tertera');
    assert(backupDataA.user?.id === userA.id, '2.6 User metadata mencocokkan akun aktif');
    assert(backupDataA.summary?.totalTransactions >= 3, '2.7 Summary mencatat jumlah transaksi');

    // 2.8 Struktur data terstruktur
    const dataSection = backupDataA.data;
    assert(Array.isArray(dataSection.transactions), '2.8 data.transactions adalah array');
    assert(Array.isArray(dataSection.wallets), '2.9 data.wallets adalah array');
    assert(Array.isArray(dataSection.categories), '2.10 data.categories adalah array');

    // 2.11 Zero Secret Leak & Isolasi User B
    const fullJsonString = JSON.stringify(backupDataA);
    assert(!fullJsonString.includes('passwordHash'), '2.11 TIDAK membocorkan passwordHash');
    assert(!fullJsonString.includes('refreshToken'), '2.12 TIDAK membocorkan refreshToken');
    assert(!fullJsonString.includes(userB.id), '2.13 TIDAK memuat ID pengguna User B');
    assert(!fullJsonString.includes('Rahasia User B Jangan Bocor'), '2.14 Data User B tidak ada dalam cadangan User A');

    // -------------------------------------------------------------
    // GRUP 3: IMPORT CADANGAN JSON — VALIDASI & REJECTION
    // -------------------------------------------------------------
    console.log('\n[TEST GRUP 3] Import JSON — Validasi Payload & Penolakan Data Tidak Sah');

    // 3.1 Request tanpa autentikasi ditolak
    const unauthImportRes = await fetch(`${BASE_URL}/data/import/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: {} })
    });
    assert(unauthImportRes.status === 401, '3.1 Import JSON tanpa token ditolak status 401');

    // 3.2 Request payload kosong ditolak
    const emptyImportRes = await fetch(`${BASE_URL}/data/import/json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({})
    });
    assert(emptyImportRes.status === 400, '3.2 Import JSON dengan berkas kosong ditolak status 400');

    // 3.3 Penolakan nominal negatif
    const negativeAmountPayload = {
      version: '1.0',
      data: {
        transactions: [
          {
            title: 'Transaksi Negatif Ilegal',
            amount: -50000,
            type: 'expense',
            date: '2026-10-12'
          }
        ]
      }
    };
    const negRes = await fetch(`${BASE_URL}/data/import/json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify(negativeAmountPayload)
    });
    const negData = await negRes.json();
    assert(negRes.status === 400, '3.3 Import dengan nominal negatif ditolak status 400', negData.message);

    // 3.4 Penolakan tanggal tidak valid
    const invalidDatePayload = {
      version: '1.0',
      data: {
        transactions: [
          {
            title: 'Transaksi Tanggal Rusak',
            amount: 50000,
            type: 'expense',
            date: 'bukan-tanggal-valid'
          }
        ]
      }
    };
    const invDateRes = await fetch(`${BASE_URL}/data/import/json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify(invalidDatePayload)
    });
    assert(invDateRes.status === 400, '3.4 Import dengan tanggal tidak valid ditolak status 400');

    // 3.5 Penolakan ukuran transaksi melebihi batas kuota (> 5000)
    const oversizedPayload = {
      version: '1.0',
      data: {
        transactions: new Array(5005).fill({
          title: 'Dummy',
          amount: 1000,
          type: 'income',
          date: '2026-10-12'
        })
      }
    };
    const overRes = await fetch(`${BASE_URL}/data/import/json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify(oversizedPayload)
    });
    assert(overRes.status === 400, '3.5 Import melebihi batas maksimum ditolak status 400');

    // -------------------------------------------------------------
    // GRUP 4: ATOMIC TRANSACTION ROLLBACK PADA IMPORT
    // -------------------------------------------------------------
    console.log('\n[TEST GRUP 4] Atomic Transaction Rollback — Pembatalan Penuh Saat Error');

    // Hitung jumlah transaksi User A sebelum tes atomik
    const countBefore = await prisma.transaction.count({
      where: { userId: userA.id }
    });

    // Buat batch di mana item ke-1 valid, namun item ke-2 korup (nominal 0 / negatif)
    const atomicTestPayload = {
      version: '1.0',
      mode: 'merge',
      data: {
        transactions: [
          {
            title: 'Transaksi Pertama Sah',
            amount: 75000,
            type: 'expense',
            date: '2026-10-12'
          },
          {
            title: 'Transaksi Kedua Cacat',
            amount: -99999, // Memicu kegagalan validasi
            type: 'expense',
            date: '2026-10-12'
          }
        ]
      }
    };

    const atomicRes = await fetch(`${BASE_URL}/data/import/json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify(atomicTestPayload)
    });

    assert(atomicRes.status === 400, '4.1 Import dengan salah satu item cacat ditolak status 400');

    // Periksa bahwa item ke-1 TIDAK pernah masuk ke database (Rollback Berhasil)
    const countAfter = await prisma.transaction.count({
      where: { userId: userA.id }
    });
    assert(countBefore === countAfter, '4.2 Atomic Rollback: Jumlah transaksi di database tidak berubah sama sekali', `Before: ${countBefore}, After: ${countAfter}`);

    const orphanedTx = await prisma.transaction.findFirst({
      where: { userId: userA.id, title: 'Transaksi Pertama Sah' }
    });
    assert(!orphanedTx, '4.3 Atomic Rollback: Transaksi pertama tidak menjadi data yatim / setengah jadi');

    // -------------------------------------------------------------
    // GRUP 5: PENCEGAHAN ID SPOOFING & MODE MERGE
    // -------------------------------------------------------------
    console.log('\n[TEST GRUP 5] Pencegahan ID Spoofing & Eksekusi Mode Merge Sukses');

    // User A mengimpor transaksi dengan userId disetel ke User B atau ID palsu
    const spoofPayload = {
      version: '1.0',
      mode: 'merge',
      data: {
        wallets: [
          {
            name: 'Dompet Impor Baru',
            type: 'ewallet',
            initialBalance: 250000,
            userId: userB.id // Mencoba mengalihkan kepemilikan ke User B
          }
        ],
        transactions: [
          {
            title: 'Gopay Topup Hasil Impor',
            amount: 50000,
            type: 'expense',
            category: 'food',
            date: '2026-10-11',
            userId: 'FAKE_USER_ID_INJECTION' // Mencoba memalsukan owner ID
          }
        ]
      }
    };

    const spoofRes = await fetch(`${BASE_URL}/data/import/json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify(spoofPayload)
    });
    const spoofResult = await spoofRes.json();

    assert(spoofRes.status === 200, '5.1 Import spoofing payload status 200 OK');
    assert(spoofResult.success === true, '5.2 Import berhasil dieksekusi');

    // Verifikasi transaksi hasil impor dimiliki strictly oleh User A, bukan User B atau FAKE_ID
    const importedTx = await prisma.transaction.findFirst({
      where: { title: 'Gopay Topup Hasil Impor' }
    });
    assert(Boolean(importedTx), '5.3 Transaksi berhasil disimpan');
    assert(importedTx.userId === userA.id, '5.4 Pencegahan Spoofing: Pemilik transaksi strictly adalah User A (yang login)', `userId: ${importedTx.userId}`);
    assert(importedTx.userId !== userB.id, '5.5 Pencegahan Spoofing: User B tidak menerima transaksi User A');

    const importedWallet = await prisma.wallet.findFirst({
      where: { name: 'Dompet Impor Baru' }
    });
    assert(Boolean(importedWallet), '5.6 Dompet hasil impor berhasil disimpan');
    assert(importedWallet.userId === userA.id, '5.7 Pemilik dompet baru strictly adalah User A');

    // -------------------------------------------------------------
    // GRUP 6: EKSEKUSI MODE REPLACE (PENGGANTIAN BERSIH ATOMIK)
    // -------------------------------------------------------------
    console.log('\n[TEST GRUP 6] Mode Replace — Penggantian Seluruh Data Secara Atomik');

    const replacePayload = {
      version: '1.0',
      mode: 'replace',
      data: {
        wallets: [
          {
            name: 'Dompet Tunggal Baru',
            type: 'cash',
            initialBalance: 1000000
          }
        ],
        transactions: [
          {
            title: 'Satu-Satunya Transaksi Baru',
            amount: 100000,
            type: 'income',
            date: '2026-10-12',
            wallet: 'Dompet Tunggal Baru',
            category: 'salary'
          }
        ]
      }
    };

    const replaceRes = await fetch(`${BASE_URL}/data/import/json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify(replacePayload)
    });
    const replaceResult = await replaceRes.json();

    assert(replaceRes.status === 200, '6.1 Mode replace status 200 OK');
    assert(replaceResult.summary?.transactions === 1, '6.2 Summary replace mencatat tepat 1 transaksi baru');

    // Periksa bahwa transaksi lama User A telah digantikan secara bersih
    const userATransactions = await prisma.transaction.findMany({
      where: { userId: userA.id }
    });
    assert(userATransactions.length === 1, '6.3 User A sekarang hanya memiliki 1 transaksi');
    assert(userATransactions[0].title === 'Satu-Satunya Transaksi Baru', '6.4 Judul transaksi sesuai data cadangan pengganti');

    // Periksa bahwa transaksi User B tetap aman tidak tersentuh oleh replace User A
    const userBTransactions = await prisma.transaction.findMany({
      where: { userId: userB.id }
    });
    assert(userBTransactions.length >= 1, '6.5 Transaksi User B tetap utuh dan aman dari replace milik User A');

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log('\n[CLEANUP] Membersihkan Data Tes Pengguna...');
    await prisma.user.deleteMany({
      where: {
        email: { in: ['tahap6_usera@fintrack.test', 'tahap6_userb@fintrack.test'] }
      }
    });

  } catch (err) {
    console.error('💥 FATAL ERROR saat menjalankan test:', err);
    testsFailed++;
  }

  console.log('\n================================================================');
  console.log(`🏁 HASIL TEST SUITE TAHAP 6:`);
  console.log(`   Lulus  : ${testsPassed}`);
  console.log(`   Gagal  : ${testsFailed}`);
  console.log('================================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests();
