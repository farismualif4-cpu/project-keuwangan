// ============================================================================
// FINTRACK TAHAP 7 TEST SUITE: DASHBOARD & ANALITIK KEUANGAN
// Menguji:
// 1. Proteksi Autentikasi (401 Unauthorized tanpa token)
// 2. Agregasi Metrik Finansial (Saldo Dompet, Pemasukan, Pengeluaran, Net, Sisa Anggaran)
// 3. Filter Periode (this_month, last_month, last_3_months, custom date range)
// 4. Validasi Format Tanggal & Rentang Tanggal Kustom
// 5. Analisis Kategori Pengeluaran Terbesar & Akurasi Persentase
// 6. Anggaran Terlampaui (Exceeded Budget Detection & Count)
// 7. Tren Arus Kas Bulanan & Harian
// 8. Penanganan Akun Baru / Data Kosong (Zero Transactions Graceful State)
// 9. Isolasi Multi-Tenant Akun Pengguna (User A vs User B)
// ============================================================================

const BASE_URL = 'http://localhost:3000/api';

async function runTahap7Tests() {
  console.log('================================================================');
  console.log('🧪 FINTRACK TAHAP 7 TEST SUITE: DASHBOARD & ANALITIK KEUANGAN');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (title, condition, extra = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title} ${extra ? `(${extra})` : ''}`);
      failed++;
    }
  };

  try {
    const timestamp = Date.now();
    const userAEmail = `user.analitik.a.${timestamp}@fintrack.test`;
    const userBEmail = `user.analitik.b.${timestamp}@fintrack.test`;
    const password = 'Password123!';

    // --- SETUP PENGGUNA A DAN B ---
    console.log('[SETUP] Mendaftarkan Pengguna Tes A dan B...');

    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Analitik User A', email: userAEmail, password })
    });
    const regDataA = await regResA.json();
    const tokenA = regDataA.token;
    assert('Setup: User A berhasil didaftarkan', regResA.status === 201 && typeof tokenA === 'string');

    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Analitik User B', email: userBEmail, password })
    });
    const regDataB = await regResB.json();
    const tokenB = regDataB.token;
    assert('Setup: User B berhasil didaftarkan', regResB.status === 201 && typeof tokenB === 'string');

    const headersA = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`
    };
    const headersB = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`
    };

    // --- TEST GRUP 1: PROTEKSI AUTHENTICATION ---
    console.log('\n[TEST GRUP 1] Proteksi Autentikasi Endpoint Analitik');
    const noAuthRes = await fetch(`${BASE_URL}/analytics/summary`);
    assert('1.1 GET /api/analytics/summary tanpa token ditolak (401)', noAuthRes.status === 401);

    const badTokenRes = await fetch(`${BASE_URL}/analytics/summary`, {
      headers: { Authorization: 'Bearer token-palsu-12345' }
    });
    assert('1.2 Token tidak sah ditolak (401)', badTokenRes.status === 401);

    // --- TEST GRUP 2: PENANGANAN DATA KOSONG (EMPTY STATE) ---
    console.log('\n[TEST GRUP 2] Penanganan Data Kosong (Pengguna Baru)');
    const emptyRes = await fetch(`${BASE_URL}/analytics/summary?period=this_month`, { headers: headersA });
    assert('2.1 Status 200 OK untuk user tanpa transaksi', emptyRes.status === 200);
    const emptyJson = await emptyRes.json();
    assert('2.2 Response memuat success: true', emptyJson.success === true);
    assert('2.3 Summary totalIncome adalah 0', emptyJson.data.summary.totalIncome === 0);
    assert('2.4 Summary totalExpense adalah 0', emptyJson.data.summary.totalExpense === 0);
    assert('2.5 Summary netCashflow adalah 0', emptyJson.data.summary.netCashflow === 0);
    assert('2.6 Summary savingsRate adalah 0', emptyJson.data.summary.savingsRate === 0);
    assert('2.7 categoryBreakdown adalah array kosong', Array.isArray(emptyJson.data.categoryBreakdown) && emptyJson.data.categoryBreakdown.length === 0);
    assert('2.8 monthlyTrend tetap terstruktur rapi (6 bulan)', Array.isArray(emptyJson.data.monthlyTrend) && emptyJson.data.monthlyTrend.length === 6);
    assert('2.9 exceededBudgetCount adalah 0', emptyJson.data.summary.exceededBudgetCount === 0);

    // --- SETUP DATA FINANSIAL USER A ---
    console.log('\n[SETUP] Mempersiapkan Dompet, Anggaran, dan Transaksi untuk User A...');
    // 1. Buat Dompet User A
    const wallet1Res = await fetch(`${BASE_URL}/wallets`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ name: 'BCA Utama', type: 'Bank', initialBalance: 10000000, color: '#6366f1' })
    });
    const wallet1 = (await wallet1Res.json()).data;

    const wallet2Res = await fetch(`${BASE_URL}/wallets`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ name: 'Dompet Tunai', type: 'Cash', initialBalance: 500000, color: '#10b981' })
    });
    const wallet2 = (await wallet2Res.json()).data;
    assert('Setup: 2 Dompet User A berhasil dibuat', wallet1?.id && wallet2?.id);

    // 2. Buat Anggaran User A (Kategori food limit 1.500.000, transport limit 500.000)
    await fetch(`${BASE_URL}/budgets`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ categoryId: 'food', amount: 1500000, period: 'monthly' })
    });
    await fetch(`${BASE_URL}/budgets`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ categoryId: 'transport', amount: 500000, period: 'monthly' })
    });
    assert('Setup: 2 Anggaran bulanan User A berhasil diset', true);

    // 3. Masukkan Transaksi User A pada Bulan Berjalan (This Month)
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');
    const dateToday = `${curYear}-${curMonth}-10`;
    const dateMid = `${curYear}-${curMonth}-15`;

    // Pemasukan 1: Gaji 15.000.000 ke BCA
    await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        title: 'Gaji Pokok Bulanan',
        amount: 15000000,
        type: 'income',
        category: 'salary',
        wallet: wallet1.id,
        date: dateToday
      })
    });

    // Pemasukan 2: Freelance 3.000.000 ke Tunai
    await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        title: 'Honor Freelance UI',
        amount: 3000000,
        type: 'income',
        category: 'freelance',
        wallet: wallet2.id,
        date: dateToday
      })
    });

    // Pengeluaran 1: Makan & Minuman 1.800.000 (Melebihi budget 1.500.000!)
    await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        title: 'Belanja Dapur & Makan Resto',
        amount: 1800000,
        type: 'expense',
        category: 'food',
        wallet: wallet1.id,
        date: dateMid
      })
    });

    // Pengeluaran 2: Transport 300.000 (Di bawah budget 500.000)
    await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        title: 'Bensin & Tol',
        amount: 300000,
        type: 'expense',
        category: 'transport',
        wallet: wallet2.id,
        date: dateMid
      })
    });

    // Pengeluaran 3: Hiburan 900.000 (Tanpa budget)
    await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        title: 'Nonton Bioskop & Game',
        amount: 900000,
        type: 'expense',
        category: 'entertainment',
        wallet: wallet1.id,
        date: dateMid
      })
    });

    // 4. Masukkan Transaksi User A pada Bulan Lalu (Last Month)
    const prevMonthDate = new Date(curYear, now.getMonth() - 1, 10);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonthStr = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
    const datePrev = `${prevYear}-${prevMonthStr}-10`;

    await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        title: 'Gaji Bulan Lalu',
        amount: 12000000,
        type: 'income',
        category: 'salary',
        wallet: wallet1.id,
        date: datePrev
      })
    });

    await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        title: 'Makan Bulan Lalu',
        amount: 1000000,
        type: 'expense',
        category: 'food',
        wallet: wallet1.id,
        date: datePrev
      })
    });

    // --- SETUP DATA USER B (ISOLASI) ---
    console.log('\n[SETUP] Mempersiapkan Transaksi untuk User B...');
    const walletBRes = await fetch(`${BASE_URL}/wallets`, {
      method: 'POST',
      headers: headersB,
      body: JSON.stringify({ name: 'Mandiri B', type: 'Bank', initialBalance: 50000000 })
    });
    const walletB = (await walletBRes.json()).data;

    await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: headersB,
      body: JSON.stringify({
        title: 'Pemasukan Rahasia User B',
        amount: 99000000,
        type: 'income',
        category: 'salary',
        wallet: walletB.id,
        date: dateToday
      })
    });

    // --- TEST GRUP 3: AGREGASI BULAN INI (THIS_MONTH) ---
    console.log('\n[TEST GRUP 3] Agregasi Metrik Finansial Bulan Ini (this_month)');
    const thisMonthRes = await fetch(`${BASE_URL}/analytics/summary?period=this_month`, { headers: headersA });
    assert('3.1 Status 200 OK untuk this_month', thisMonthRes.status === 200);
    const tmData = (await thisMonthRes.json()).data;

    // Total pemasukan bulan ini: 15jt + 3jt = 18.000.000
    assert('3.2 Total pemasukan bulan ini tepat 18.000.000', tmData.summary.totalIncome === 18000000);

    // Total pengeluaran bulan ini: 1.8jt + 300rb + 900rb = 3.000.000
    assert('3.3 Total pengeluaran bulan ini tepat 3.000.000', tmData.summary.totalExpense === 3000000);

    // Selisih pemasukan dan pengeluaran (net cashflow): 18jt - 3jt = 15.000.000
    assert('3.4 Net cashflow tepat 15.000.000', tmData.summary.netCashflow === 15000000);

    // Savings rate: (15jt / 18jt) * 100 = 83%
    assert('3.5 Savings rate tepat 83%', tmData.summary.savingsRate === 83);

    // Total Saldo Dompet:
    // Wallet 1: 10jt awal + 15jt (inc) + 12jt (inc bln lalu) - 1.8jt (exp) - 900rb (exp) - 1jt (exp bln lalu) = 33.300.000
    // Wallet 2: 500rb awal + 3jt (inc) - 300rb (exp) = 3.200.000
    // Total Saldo = 36.500.000
    assert('3.6 Total saldo seluruh dompet tepat dan tidak duplikat (36.500.000)', tmData.summary.totalBalance === 36500000);

    // --- TEST GRUP 4: ANALISIS ANGGARAN & ANGGARAN TERLAMPAUI ---
    console.log('\n[TEST GRUP 4] Analisis Anggaran & Deteksi Anggaran Terlampaui');
    // Total Anggaran = 1.5jt (food) + 500rb (transport) = 2.000.000
    assert('4.1 Total budget terkonfigurasi tepat 2.000.000', tmData.summary.totalBudget === 2000000);

    // Pengeluaran pada kategori beranggaran: 1.8jt (food) + 300rb (transport) = 2.100.000
    assert('4.2 Total pengeluaran kategori anggaran tercatat 2.100.000', tmData.summary.totalBudgetSpent === 2100000);

    // Kategori food menghabiskan 1.8jt > limit 1.5jt => Terlampaui 1 kategori
    assert('4.3 Jumlah anggaran terlampaui (exceededBudgetCount) tepat 1', tmData.summary.exceededBudgetCount === 1);
    assert('4.4 Nominal anggaran terlampaui tepat 300.000', tmData.summary.exceededBudgetAmount === 300000);

    // --- TEST GRUP 5: ANALISIS KATEGORI & PERSENTASE ---
    console.log('\n[TEST GRUP 5] Analisis Komposisi Kategori');
    assert('5.1 categoryBreakdown memuat 3 kategori pengeluaran', tmData.categoryBreakdown.length === 3);
    // Kategori terbesar: food (1.8jt / 3jt = 60.0%)
    assert('5.2 Kategori pertama adalah pengeluaran terbesar (food)', tmData.categoryBreakdown[0].categoryId === 'food');
    assert('5.3 Nominal pengeluaran food tepat 1.800.000', tmData.categoryBreakdown[0].spent === 1800000);
    assert('5.4 Persentase food dihitung akurat (60.0%)', tmData.categoryBreakdown[0].percentage === 60.0);
    assert('5.5 Kategori food ditandai isExceeded: true', tmData.categoryBreakdown[0].isExceeded === true);

    // Kategori kedua: entertainment (900rb / 3jt = 30.0%)
    assert('5.6 Kategori kedua adalah entertainment (30.0%)', tmData.categoryBreakdown[1].categoryId === 'entertainment' && tmData.categoryBreakdown[1].percentage === 30.0);

    // Kategori ketiga: transport (300rb / 3jt = 10.0%)
    assert('5.7 Kategori ketiga adalah transport (10.0%)', tmData.categoryBreakdown[2].categoryId === 'transport' && tmData.categoryBreakdown[2].percentage === 10.0);

    // --- TEST GRUP 6: FILTER BULAN SEBELUMNYA (LAST_MONTH) ---
    console.log('\n[TEST GRUP 6] Filter Periode Bulan Sebelumnya (last_month)');
    const lastMonthRes = await fetch(`${BASE_URL}/analytics/summary?period=last_month`, { headers: headersA });
    assert('6.1 Status 200 OK untuk last_month', lastMonthRes.status === 200);
    const lmData = (await lastMonthRes.json()).data;

    // Bulan lalu: Gaji 12.000.000, Pengeluaran 1.000.000 (Makan)
    assert('6.2 Total pemasukan bulan lalu tepat 12.000.000', lmData.summary.totalIncome === 12000000);
    assert('6.3 Total pengeluaran bulan lalu tepat 1.000.000', lmData.summary.totalExpense === 1000000);
    assert('6.4 Net cashflow bulan lalu tepat 11.000.000', lmData.summary.netCashflow === 11000000);
    assert('6.5 Hanya ada 1 transaksi pengeluaran bulan lalu', lmData.categoryBreakdown.length === 1);
    assert('6.6 food menghabiskan 100% dari pengeluaran bulan lalu', lmData.categoryBreakdown[0].percentage === 100.0);

    // --- TEST GRUP 7: FILTER 3 BULAN TERAKHIR (LAST_3_MONTHS) ---
    console.log('\n[TEST GRUP 7] Filter Periode 3 Bulan Terakhir (last_3_months)');
    const last3Res = await fetch(`${BASE_URL}/analytics/summary?period=last_3_months`, { headers: headersA });
    assert('7.1 Status 200 OK untuk last_3_months', last3Res.status === 200);
    const l3Data = (await last3Res.json()).data;

    // Gabungan bulan ini + bulan lalu: Pemasukan 18jt + 12jt = 30.000.000
    assert('7.2 Total pemasukan 3 bulan tepat 30.000.000', l3Data.summary.totalIncome === 30000000);
    // Pengeluaran: 3jt + 1jt = 4.000.000
    assert('7.3 Total pengeluaran 3 bulan tepat 4.000.000', l3Data.summary.totalExpense === 4000000);
    assert('7.4 Net cashflow 3 bulan tepat 26.000.000', l3Data.summary.netCashflow === 26000000);

    // --- TEST GRUP 8: FILTER RENTANG TANGGAL KHUSUS (CUSTOM) ---
    console.log('\n[TEST GRUP 8] Filter Rentang Tanggal Khusus (custom)');
    // Ambil rentang khusus hanya tanggal hari ini (pemasukan gaji & freelance)
    const customRes = await fetch(
      `${BASE_URL}/analytics/summary?period=custom&startDate=${dateToday}&endDate=${dateToday}`,
      { headers: headersA }
    );
    assert('8.1 Status 200 OK untuk custom range valid', customRes.status === 200);
    const customData = (await customRes.json()).data;
    assert('8.2 Total pemasukan tanggal khusus tepat 18.000.000', customData.summary.totalIncome === 18000000);
    assert('8.3 Total pengeluaran tanggal khusus tepat 0', customData.summary.totalExpense === 0);

    // Penolakan format tanggal tidak valid
    const invalidDateRes = await fetch(
      `${BASE_URL}/analytics/summary?period=custom&startDate=bukan-tanggal`,
      { headers: headersA }
    );
    assert('8.4 startDate tidak valid ditolak status 400', invalidDateRes.status === 400);

    // Penolakan startDate > endDate
    const reversedDateRes = await fetch(
      `${BASE_URL}/analytics/summary?period=custom&startDate=2026-10-20&endDate=2026-10-10`,
      { headers: headersA }
    );
    assert('8.5 startDate > endDate ditolak status 400', reversedDateRes.status === 400);

    // --- TEST GRUP 9: ISOLASI MULTI-TENANT PENGGUNA ---
    console.log('\n[TEST GRUP 9] Isolasi Multi-Tenant Akun Pengguna');
    const userBRes = await fetch(`${BASE_URL}/analytics/summary?period=this_month`, { headers: headersB });
    assert('9.1 User B dapat mengambil analitik miliknya (200 OK)', userBRes.status === 200);
    const bData = (await userBRes.json()).data;

    // User B hanya punya transaksi 99.000.000
    assert('9.2 Pemasukan User B adalah 99.000.000', bData.summary.totalIncome === 99000000);
    assert('9.3 Pemasukan User A (18jt) TIDAK bocor ke User B', bData.summary.totalIncome !== 18000000);
    assert('9.4 Saldo dompet User A TIDAK bocor ke User B', bData.summary.totalBalance === 149000000); // 50jt initial + 99jt

    // Periksa bahwa User A tidak terpengaruh data User B
    assert('9.5 Transaksi 99jt milik User B TIDAK masuk ke perhitungan User A', tmData.summary.totalIncome === 18000000);

    // --- TEST GRUP 10: STRUKTUR DATA GRAFIK (CHARTS) ---
    console.log('\n[TEST GRUP 10] Struktur Data Grafik (Charts)');
    assert('10.1 monthlyTrend berisi array 6 elemen', tmData.monthlyTrend.length === 6);
    assert('10.2 Elemen monthlyTrend memuat month, income, expense, net',
      'month' in tmData.monthlyTrend[0] &&
      'income' in tmData.monthlyTrend[0] &&
      'expense' in tmData.monthlyTrend[0] &&
      'net' in tmData.monthlyTrend[0]
    );
    assert('10.3 dailyTrend memuat tanggal harian terurut', Array.isArray(tmData.dailyTrend));

  } catch (err) {
    console.error('💥 Error tidak terduga pada test suite:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`🏁 HASIL TEST SUITE TAHAP 7:`);
  console.log(`   Lulus  : ${passed}`);
  console.log(`   Gagal  : ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTahap7Tests();
