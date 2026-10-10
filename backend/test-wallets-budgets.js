/**
 * Test Otomatis FinTrack — Tahap 3: Database Dompet (Wallets) dan Anggaran (Budgets)
 * Menguji 14 skenario minimal termasuk isolasi multi-tenant, validasi input, dan proteksi transaksi.
 */

const BASE_URL = 'http://localhost:3000/api';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`❌ [FAIL] ${message}`);
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTestSuite() {
  console.log('🧪 Memulai pengujian otomatis Tahap 3: Database Dompet & Anggaran...\n');

  const timestamp = Date.now();
  const userAEmail = `wallet.userA.${timestamp}@test.com`;
  const userBEmail = `wallet.userB.${timestamp}@test.com`;

  // --- 1. Setup Dua Pengguna untuk Uji Multi-Tenant ---
  const regA = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'User A', email: userAEmail, password: 'password123' })
  });
  const tokenA = regA.data.token || regA.data.data?.token;
  const userAId = regA.data.user?.id || regA.data.data?.user?.id;

  const regB = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'User B', email: userBEmail, password: 'password123' })
  });
  const tokenB = regB.data.token || regB.data.data?.token;
  const userBId = regB.data.user?.id || regB.data.data?.user?.id;

  console.log('--- 1. Proteksi Autentikasi (Request Tanpa Token Ditolak) ---');
  const noTokenWallet = await request('/wallets');
  assert(noTokenWallet.status === 401, '11. GET /api/wallets tanpa token ditolak (401)');

  const noTokenBudget = await request('/budgets');
  assert(noTokenBudget.status === 401, '11. GET /api/budgets tanpa token ditolak (401)');

  console.log('\n--- 2. Pengujian Dompet (Wallets) untuk Pengguna A ---');
  // 10. Validasi input nama dompet kosong
  const invalidWallet = await request('/wallets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ name: '', initialBalance: -1000 })
  });
  assert(invalidWallet.status === 400, '10. Input dompet tidak valid ditolak (400)');

  // 1. Pengguna login dapat membuat dompet
  const createWalletRes = await request('/wallets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'Bank BCA Utama',
      type: 'Bank',
      initialBalance: 5000000,
      color: '#0060af',
      icon: 'Building2'
    })
  });
  assert(createWalletRes.status === 201, '1. Pengguna A berhasil membuat dompet baru (201)');
  const walletAId = createWalletRes.data.data.id;
  assert(walletAId && createWalletRes.data.data.name === 'Bank BCA Utama', '1. Data dompet A tersimpan dengan benar');

  // 2. Pengguna dapat melihat daftar dompet miliknya
  const listWalletsA = await request('/wallets', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(listWalletsA.status === 200, '2. Pengguna A dapat melihat daftar dompet (200)');
  assert(listWalletsA.data.data.some(w => w.id === walletAId), '2. Dompet yang dibuat ada dalam daftar');

  // Ambil detail by ID
  const getWalletByIdRes = await request(`/wallets/${walletAId}`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(getWalletByIdRes.status === 200, 'Pengguna A dapat mengambil detail dompet by ID (200)');

  // 3. Pengguna dapat mengubah dompet miliknya
  const updateWalletRes = await request(`/wallets/${walletAId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ name: 'Bank BCA Payroll', initialBalance: 7500000 })
  });
  assert(updateWalletRes.status === 200, '3. Pengguna A berhasil memperbarui dompet (200)');
  assert(updateWalletRes.data.data.name === 'Bank BCA Payroll', '3. Nama dompet terupdate menjadi Bank BCA Payroll');

  // 4. ID dompet yang tidak ditemukan ditangani dengan benar
  const notFoundWallet = await request('/wallets/non-existent-uuid-999', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(notFoundWallet.status === 404, '4. ID dompet yang tidak ada menghasilkan 404');

  console.log('\n--- 3. Isolasi Multi-Tenant Dompet (Pengguna A vs Pengguna B) ---');
  // Buat dompet untuk Pengguna B
  const createWalletBRes = await request('/wallets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({ name: 'Dompet Tunai B', type: 'Cash', initialBalance: 200000 })
  });
  const walletBId = createWalletBRes.data.data.id;

  // 5. Pengguna A tidak bisa membaca dompet pengguna B
  const crossGetWallet = await request(`/wallets/${walletBId}`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(crossGetWallet.status === 404, '5. Pengguna A mencoba GET dompet milik B ditolak (404)');

  const listWalletsB = await request('/wallets', {
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  assert(!listWalletsB.data.data.some(w => w.id === walletAId), '5. Daftar dompet B TIDAK memuat dompet A');

  // 6. Pengguna A tidak bisa mengubah atau menghapus dompet pengguna B
  const crossPutWallet = await request(`/wallets/${walletBId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ name: 'Hack Name' })
  });
  assert(crossPutWallet.status === 404, '6. Pengguna A mencoba PUT dompet milik B ditolak (404)');

  const crossDelWallet = await request(`/wallets/${walletBId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(crossDelWallet.status === 404, '6. Pengguna A mencoba DELETE dompet milik B ditolak (404)');

  console.log('\n--- 4. Proteksi Transaksi Terkait Saat Hapus Dompet ---');
  // Buat transaksi yang menggunakan dompet walletAId
  const txRes = await request('/transactions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      title: 'Beli Kopi',
      amount: 35000,
      type: 'expense',
      category: 'food',
      wallet: walletAId,
      date: '2026-10-11'
    })
  });
  const createdTxId = txRes.data.data.id;

  // Coba hapus dompet yang masih punya transaksi
  const deleteBlockedWallet = await request(`/wallets/${walletAId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(deleteBlockedWallet.status === 400, 'Hapus dompet yang masih memiliki transaksi ditolak (400)');

  // Hapus transaksi terlebih dahulu, lalu hapus dompet
  await request(`/transactions/${createdTxId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  const deleteSuccessWallet = await request(`/wallets/${walletAId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(deleteSuccessWallet.status === 200, '3b. Dompet tanpa transaksi berhasil dihapus (200)');

  console.log('\n--- 5. Pengujian Anggaran (Budgets) untuk Pengguna A ---');
  // 10. Validasi input anggaran tidak valid
  const invalidBudget = await request('/budgets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ categoryId: '', amount: -50000 })
  });
  assert(invalidBudget.status === 400, '10. Input anggaran tidak valid ditolak (400)');

  // 7. Pengguna yang login dapat membuat anggaran
  const createBudgetRes = await request('/budgets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      categoryId: 'food',
      amount: 2500000,
      period: 'monthly'
    })
  });
  assert(createBudgetRes.status === 201 || createBudgetRes.status === 200, '7. Pengguna A berhasil membuat anggaran kategori "food"');
  const budgetAId = createBudgetRes.data.data.id;
  assert(budgetAId && createBudgetRes.data.data.limit === 2500000, '7. Batas limit anggaran tersimpan');

  // 8. Pengguna dapat membaca daftar anggarannya
  const listBudgetsA = await request('/budgets', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(listBudgetsA.status === 200, '8. Pengguna A dapat membaca daftar anggaran (200)');
  assert(listBudgetsA.data.data.some(b => b.id === budgetAId), '8. Anggaran kategori "food" ada di daftar');

  // Pengguna dapat membaca detail anggaran by ID
  const getBudgetByIdRes = await request(`/budgets/${budgetAId}`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(getBudgetByIdRes.status === 200, 'Pengguna A dapat membaca detail anggaran by ID (200)');

  // Pengguna dapat mengubah anggarannya
  const updateBudgetRes = await request(`/budgets/${budgetAId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ amount: 3000000 })
  });
  assert(updateBudgetRes.status === 200, '8. Pengguna A berhasil mengubah limit anggaran (200)');
  assert(updateBudgetRes.data.data.limit === 3000000, '8. Nominal limit anggaran terupdate ke 3000000');

  // ID anggaran tidak ditemukan
  const notFoundBudget = await request('/budgets/non-existent-budget-uuid', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(notFoundBudget.status === 404, 'ID anggaran yang tidak ada menghasilkan 404');

  console.log('\n--- 6. Isolasi Multi-Tenant Anggaran (Pengguna A vs Pengguna B) ---');
  // Buat anggaran untuk Pengguna B
  const createBudgetBRes = await request('/budgets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({ categoryId: 'transport', amount: 800000, period: 'monthly' })
  });
  const budgetBId = createBudgetBRes.data.data.id;

  // 9. Pengguna A tidak dapat mengakses anggaran pengguna B
  const crossGetBudget = await request(`/budgets/${budgetBId}`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(crossGetBudget.status === 404, '9. Pengguna A mencoba GET anggaran milik B ditolak (404)');

  const crossPutBudget = await request(`/budgets/${budgetBId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ amount: 100000 })
  });
  assert(crossPutBudget.status === 404, '9. Pengguna A mencoba PUT anggaran milik B ditolak (404)');

  const crossDelBudget = await request(`/budgets/${budgetBId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(crossDelBudget.status === 404, '9. Pengguna A mencoba DELETE anggaran milik B ditolak (404)');

  // 8b. Pengguna A menghapus anggarannya sendiri
  const deleteBudgetARes = await request(`/budgets/${budgetAId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(deleteBudgetARes.status === 200, '8b. Pengguna A berhasil menghapus anggarannya sendiri (200)');

  console.log('\n--- 7. Verifikasi Kompatibilitas Regresi ---');
  // 12. Transaksi dan autentikasi lama tetap berfungsi
  const meCheck = await request('/auth/me', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  const meUser = meCheck.data.user || meCheck.data.data?.user;
  assert(meCheck.status === 200 && meUser?.email === userAEmail.toLowerCase(), '12. Endpoint /api/auth/me tetap berfungsi normal (200)');

  const txListCheck = await request('/transactions', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(txListCheck.status === 200 && Array.isArray(txListCheck.data.data), '12. Endpoint /api/transactions tetap berfungsi normal (200)');

  console.log('\n================================================================');
  console.log(`📊 RINGKASAN TEST WALLETS & BUDGETS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
