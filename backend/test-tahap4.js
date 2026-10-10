/**
 * Test Suite FinTrack — Tahap 4: Kategori Dinamis, Filter Transaksi, dan Paginasi
 *
 * Menguji secara komprehensif:
 * 1. Autentikasi 2 pengguna baru (User A dan User B).
 * 2. GET /api/categories mengembalikan kategori sistem bawaan (13 kategori).
 * 3. Kategori sistem terlindungi (PUT & DELETE -> 403 Forbidden).
 * 4. User A membuat kategori kustom (Income & Expense).
 * 5. Validasi kategori kustom (nama pendek, tipe salah, nama duplikat -> 400).
 * 6. Isolasi data kategori: User B tidak bisa GET / PUT / DELETE kategori User A (404 Not Found).
 * 7. Transaksi dengan kategori valid berhasil dibuat.
 * 8. Transaksi dengan kategori fiktif / tidak ada ditolak (400 Bad Request).
 * 9. Kategori yang sedang digunakan transaksi / anggaran ditolak saat dihapus (400 Bad Request).
 * 10. Filter transaksi (type, category, wallet, search, startDate, endDate).
 * 11. Validasi filter tanggal (format salah -> 400, startDate > endDate -> 400).
 * 12. Paginasi transaksi (page, limit, total, totalPages, batas max limit 100).
 * 13. Isolasi transaksi: User B tidak melihat transaksi User A.
 * 14. Endpoint tanpa token ditolak (401 Unauthorized).
 */

const BASE_URL = 'http://localhost:3000/api';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    testsFailed++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 FINTRACK TAHAP 4 TEST SUITE: CATEGORIES & FILTER');
  console.log('====================================================\n');

  try {
    // 0. HEALTH CHECK
    console.log('[TEST GROUP 0] Memeriksa Health Server');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'OK', 'GET /api/health mengembalikan 200 OK');

    // 1. DAFTARKAN DUA USER UNTUK MULTI-TENANT TEST
    const timestamp = Date.now();
    const userA = {
      name: `User Alpha ${timestamp}`,
      email: `alpha_${timestamp}@test.com`,
      password: 'Password123!'
    };
    const userB = {
      name: `User Beta ${timestamp}`,
      email: `beta_${timestamp}@test.com`,
      password: 'Password123!'
    };

    console.log('\n[TEST GROUP 1] Registrasi User A dan User B');
    const regARes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userA)
    });
    const regAData = await regARes.json();
    const tokenA = regAData.token || regAData.data?.token;
    assert(regARes.status === 201 && tokenA, 'User A berhasil registrasi dan mendapat token');

    const regBRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userB)
    });
    const regBData = await regBRes.json();
    const tokenB = regBData.token || regBData.data?.token;
    assert(regBRes.status === 201 && tokenB, 'User B berhasil registrasi dan mendapat token');

    // 2. KATEGORI SISTEM & AKSES TANPA TOKEN
    console.log('\n[TEST GROUP 2] Kategori Sistem & Akses Auth');
    const unauthCatRes = await fetch(`${BASE_URL}/categories`);
    assert(unauthCatRes.status === 401, 'GET /api/categories tanpa token ditolak (401 Unauthorized)');

    const catARes = await fetch(`${BASE_URL}/categories`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const catAData = await catARes.json();
    assert(catARes.status === 200, 'User A dapat mengambil daftar kategori (200 OK)');
    assert(Array.isArray(catAData.data) && catAData.data.length >= 13, `Mengembalikan setidaknya 13 kategori sistem (ditemukan: ${catAData.data.length})`);
    
    const foodCat = catAData.data.find(c => c.id === 'food');
    assert(foodCat && foodCat.isSystem === true && foodCat.type === 'expense', 'Kategori sistem "food" ditemukan dengan isSystem=true');

    // Filter kategori sistem berdasarkan type
    const expenseCatRes = await fetch(`${BASE_URL}/categories?type=expense`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const expenseCatData = await expenseCatRes.json();
    const allExpenses = expenseCatData.data.every(c => c.type === 'expense');
    assert(allExpenses && expenseCatData.data.length >= 8, 'Query ?type=expense hanya mengembalikan kategori expense');

    // 3. PERLINDUNGAN KATEGORI SISTEM
    console.log('\n[TEST GROUP 3] Perlindungan Kategori Sistem');
    const putSystemRes = await fetch(`${BASE_URL}/categories/food`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ name: 'Makanan Modif' })
    });
    assert(putSystemRes.status === 403, 'PUT /api/categories/food ditolak dengan 403 Forbidden');

    const delSystemRes = await fetch(`${BASE_URL}/categories/food`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(delSystemRes.status === 403, 'DELETE /api/categories/food ditolak dengan 403 Forbidden');

    // 4. PEMBUATAN & VALIDASI KATEGORI KUSTOM
    console.log('\n[TEST GROUP 4] Pembuatan & Validasi Kategori Kustom');
    // Validasi nama terlalu pendek
    const shortNameRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ name: 'A', type: 'expense' })
    });
    assert(shortNameRes.status === 400, 'Nama kategori < 2 karakter ditolak (400 Bad Request)');

    // Validasi tipe salah
    const invalidTypeRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ name: 'Investasi Emas', type: 'crypto' })
    });
    assert(invalidTypeRes.status === 400, 'Tipe kategori selain income/expense ditolak (400 Bad Request)');

    // Berhasil buat kategori kustom Expense
    const createCatRes1 = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: 'Langganan AI',
        type: 'expense',
        color: '#6366F1',
        icon: 'Bot'
      })
    });
    const createCatData1 = await createCatRes1.json();
    assert(createCatRes1.status === 201 && createCatData1.data.id, 'User A berhasil membuat kategori kustom "Langganan AI" (201 Created)');
    const customCatIdA = createCatData1.data.id;

    // Buat kategori kustom Income
    const createCatRes2 = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: 'Dividen Saham',
        type: 'income',
        color: '#10B981',
        icon: 'TrendingUp'
      })
    });
    const createCatData2 = await createCatRes2.json();
    assert(createCatRes2.status === 201, 'User A berhasil membuat kategori kustom Income "Dividen Saham"');

    // Cegah duplikasi nama kategori yang sama untuk user A
    const duplicateCatRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: 'Langganan AI',
        type: 'expense'
      })
    });
    assert(duplicateCatRes.status === 400, 'Kategori kustom duplikat untuk user yang sama ditolak (400 Bad Request)');

    // 5. ISOLASI MULTI-TENANT KATEGORI
    console.log('\n[TEST GROUP 5] Isolasi Multi-Tenant Kategori');
    // User B mencoba membaca kategori User A melalui ID
    const userBGetCatA = await fetch(`${BASE_URL}/categories/${customCatIdA}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert(userBGetCatA.status === 404, 'User B tidak dapat mengakses kategori User A via ID (404 Not Found)');

    // User B mencoba mengedit kategori User A
    const userBPutCatA = await fetch(`${BASE_URL}/categories/${customCatIdA}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({ name: 'Hacked Cat' })
    });
    assert(userBPutCatA.status === 404, 'User B tidak dapat mengubah kategori User A (404 Not Found)');

    // User B mencoba menghapus kategori User A
    const userBDelCatA = await fetch(`${BASE_URL}/categories/${customCatIdA}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert(userBDelCatA.status === 404, 'User B tidak dapat menghapus kategori User A (404 Not Found)');

    // User B melihat daftar kategori miliknya: tidak boleh ada "Langganan AI"
    const catBListRes = await fetch(`${BASE_URL}/categories`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const catBListData = await catBListRes.json();
    const hasLangganan = catBListData.data.some(c => c.name === 'Langganan AI');
    assert(!hasLangganan, 'Daftar kategori User B tidak memuat kategori kustom User A');

    // 6. VALIDASI KATEGORI PADA TRANSAKSI & BUDGET
    console.log('\n[TEST GROUP 6] Integrasi Kategori pada Transaksi & Proteksi Hapus');
    // Transaksi dengan kategori fiktif
    const fakeCatTxRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Beli Kopi Fiktif',
        amount: 25000,
        type: 'expense',
        category: 'kategori_palsu_123',
        wallet: 'cash',
        date: '2026-10-10'
      })
    });
    assert(fakeCatTxRes.status === 400, 'Transaksi dengan ID kategori fiktif ditolak (400 Bad Request)');

    // Buat transaksi valid menggunakan kategori kustom User A
    const validTxRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Langganan ChatGPT Plus',
        amount: 350000,
        type: 'expense',
        category: customCatIdA,
        wallet: 'bank',
        date: '2026-10-01'
      })
    });
    const validTxData = await validTxRes.json();
    assert(validTxRes.status === 201 && validTxData.data.id, 'Transaksi dengan kategori kustom berhasil dibuat');

    // Coba hapus kategori kustom yang sedang dipakai transaksi
    const delUsedCatRes = await fetch(`${BASE_URL}/categories/${customCatIdA}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(delUsedCatRes.status === 400, 'Penghapusan kategori yang masih digunakan transaksi ditolak (400 Bad Request)');

    // 7. FILTER TRANSAKSI & PAGINASI
    console.log('\n[TEST GROUP 7] Filter Transaksi & Paginasi Database');
    // Tambahkan beberapa transaksi untuk User A agar kita bisa menguji filter dan paginasi dengan tuntas
    const seedTransactions = [
      { title: 'Gaji Pokok Oktober', amount: 15000000, type: 'income', category: 'salary', wallet: 'bank', date: '2026-10-01' },
      { title: 'Dividen Q3', amount: 500000, type: 'income', category: createCatData2.data.id, wallet: 'bank', date: '2026-10-05' },
      { title: 'Makan Siang Soto', amount: 35000, type: 'expense', category: 'food', wallet: 'cash', date: '2026-10-03' },
      { title: 'Bensin Motor', amount: 50000, type: 'expense', category: 'transport', wallet: 'cash', date: '2026-10-04' },
      { title: 'Beli Buku Pemrograman', amount: 120000, type: 'expense', category: 'education', wallet: 'bank', date: '2026-10-08' },
      { title: 'Makan Malam Sushi', amount: 180000, type: 'expense', category: 'food', wallet: 'ewallet', date: '2026-10-09' },
      { title: 'Tagihan Listrik PLN', amount: 450000, type: 'expense', category: 'bills', wallet: 'bank', date: '2026-10-10' }
    ];

    for (const tx of seedTransactions) {
      await fetch(`${BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenA}`
        },
        body: JSON.stringify(tx)
      });
    }

    // 7.1 Filter Type = income
    const filterIncomeRes = await fetch(`${BASE_URL}/transactions?type=income`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const filterIncomeData = await filterIncomeRes.json();
    assert(filterIncomeRes.status === 200, 'GET /api/transactions?type=income sukses (200 OK)');
    assert(
      filterIncomeData.data.every(t => t.type === 'income') && filterIncomeData.data.length === 2,
      `Filter type=income menghasilkan tepat 2 transaksi pemasukan (ditemukan: ${filterIncomeData.data.length})`
    );

    // 7.2 Filter Category = food
    const filterFoodRes = await fetch(`${BASE_URL}/transactions?category=food`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const filterFoodData = await filterFoodRes.json();
    assert(
      filterFoodData.data.every(t => t.category === 'food') && filterFoodData.data.length === 2,
      `Filter category=food menghasilkan 2 transaksi (ditemukan: ${filterFoodData.data.length})`
    );

    // 7.3 Filter Wallet = cash
    const filterWalletRes = await fetch(`${BASE_URL}/transactions?wallet=cash`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const filterWalletData = await filterWalletRes.json();
    assert(
      filterWalletData.data.every(t => t.wallet === 'cash') && filterWalletData.data.length === 2,
      `Filter wallet=cash menghasilkan tepat 2 transaksi (ditemukan: ${filterWalletData.data.length})`
    );

    // 7.4 Filter Search = "Makan"
    const filterSearchRes = await fetch(`${BASE_URL}/transactions?search=makan`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const filterSearchData = await filterSearchRes.json();
    assert(
      filterSearchData.data.length === 2 && filterSearchData.data.every(t => t.title.toLowerCase().includes('makan')),
      `Filter search=makan mengembalikan 2 transaksi yang cocok (ditemukan: ${filterSearchData.data.length})`
    );

    // 7.5 Filter Tanggal (Date Range)
    const filterDateRes = await fetch(`${BASE_URL}/transactions?startDate=2026-10-03&endDate=2026-10-05`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const filterDateData = await filterDateRes.json();
    // Transaksi yang jatuh pada rentang 3-5 Okt:
    // Makan Siang Soto (03 Okt), Bensin Motor (04 Okt), Dividen Q3 (05 Okt) -> total 3
    assert(
      filterDateData.data.length === 3,
      `Filter rentang tanggal 2026-10-03 s/d 2026-10-05 mengembalikan 3 transaksi (ditemukan: ${filterDateData.data.length})`
    );

    // Validasi Tanggal Error
    const invalidDateRes = await fetch(`${BASE_URL}/transactions?startDate=invalid-date`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(invalidDateRes.status === 400, 'Format startDate tidak valid ditolak (400 Bad Request)');

    const invertedDateRes = await fetch(`${BASE_URL}/transactions?startDate=2026-10-10&endDate=2026-10-01`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(invertedDateRes.status === 400, 'startDate > endDate ditolak (400 Bad Request)');

    // 8. PAGINASI TRANSAKSI
    console.log('\n[TEST GROUP 8] Pengujian Paginasi & Metadata');
    // User A memiliki total 8 transaksi (1 ChatGPT + 7 seed)
    const page1Res = await fetch(`${BASE_URL}/transactions?page=1&limit=3`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const page1Data = await page1Res.json();
    assert(page1Res.status === 200, 'GET transaksi paginasi mengembalikan 200 OK');
    assert(page1Data.data.length === 3, 'Halaman 1 dengan limit 3 mengembalikan 3 transaksi');
    assert(page1Data.pagination.page === 1, 'Metadata pagination.page === 1');
    assert(page1Data.pagination.limit === 3, 'Metadata pagination.limit === 3');
    assert(page1Data.pagination.total === 8, `Metadata pagination.total === 8 (ditemukan: ${page1Data.pagination.total})`);
    assert(page1Data.pagination.totalPages === 3, `Metadata pagination.totalPages === 3 (ditemukan: ${page1Data.pagination.totalPages})`);

    // Halaman 2
    const page2Res = await fetch(`${BASE_URL}/transactions?page=2&limit=3`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const page2Data = await page2Res.json();
    assert(page2Data.data.length === 3, 'Halaman 2 dengan limit 3 mengembalikan 3 transaksi');
    assert(page2Data.data[0].id !== page1Data.data[0].id, 'Data halaman 2 berbeda dengan halaman 1');

    // Halaman 3 (sisa 2 transaksi)
    const page3Res = await fetch(`${BASE_URL}/transactions?page=3&limit=3`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const page3Data = await page3Res.json();
    assert(page3Data.data.length === 2, 'Halaman 3 mengembalikan sisa 2 transaksi');

    // Paginasi di luar batas halaman yang ada
    const page99Res = await fetch(`${BASE_URL}/transactions?page=99&limit=3`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const page99Data = await page99Res.json();
    assert(page99Data.data.length === 0, 'Halaman di luar jangkauan mengembalikan array kosong');

    // Validasi parameter page < 1
    const invalidPageRes = await fetch(`${BASE_URL}/transactions?page=0`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(invalidPageRes.status === 400, 'Query page < 1 ditolak (400 Bad Request)');

    // Batas limit maksimal capped di 100
    const overLimitRes = await fetch(`${BASE_URL}/transactions?limit=250`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const overLimitData = await overLimitRes.json();
    assert(overLimitData.pagination.limit === 100, 'Limit melebihi batas dipatok aman ke maksimum 100');

    // 9. ISOLASI TRANSAKSI MULTI-TENANT
    console.log('\n[TEST GROUP 9] Isolasi Transaksi Antar Pengguna');
    const userBTxRes = await fetch(`${BASE_URL}/transactions`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const userBTxData = await userBTxRes.json();
    assert(
      userBTxData.data.length === 0 && userBTxData.pagination.total === 0,
      'User B tidak dapat melihat transaksi User A (total: 0)'
    );

    // 10. EDIT KATEGORI KUSTOM & HAPUS SETELAH BERSIH
    console.log('\n[TEST GROUP 10] Pembaruan & Penghapusan Kategori Kustom');
    // Update kategori User A yang belum ada transaksi (Dividen Saham memiliki 1 tx, jadi buat kategori baru untuk dihapus)
    const tempCatRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ name: 'Hobi Fotografi', type: 'expense', color: '#EC4899', icon: 'Camera' })
    });
    const tempCatData = await tempCatRes.json();
    const tempCatId = tempCatData.data.id;

    // Update nama
    const updateTempRes = await fetch(`${BASE_URL}/categories/${tempCatId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ name: 'Hobi Fotografi & Videografi', color: '#DB2777' })
    });
    const updateTempData = await updateTempRes.json();
    assert(updateTempRes.status === 200 && updateTempData.data.name === 'Hobi Fotografi & Videografi', 'User A berhasil mengubah kategori miliknya');

    // Hapus kategori yang belum terikat data
    const deleteTempRes = await fetch(`${BASE_URL}/categories/${tempCatId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(deleteTempRes.status === 200, 'User A berhasil menghapus kategori kustom yang tidak dipakai');

  } catch (err) {
    console.error('💥 UNCAUGHT EXCEPTION DURING TESTS:', err);
    testsFailed++;
  }

  console.log('\n====================================================');
  console.log(`📊 RINGKASAN HASIL TEST TAHAP 4:`);
  console.log(`   Total Lulus (PASS): ${testsPassed}`);
  console.log(`   Total Gagal (FAIL): ${testsFailed}`);
  console.log('====================================================');

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
