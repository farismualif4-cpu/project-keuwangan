// Skrip pengujian otomatis REST API FinTrack (dengan Bearer Auth)
const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('🧪 Memulai pengujian menyeluruh API FinTrack...\n');
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
    // 1. Test GET /api/health (Publik)
    console.log('--- 1. Uji Health Endpoint ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert('Health Status 200', healthRes.status === 200);
    assert('Health Body OK', healthData.status === 'OK');
    assert('Database Connected', healthData.database?.status === 'Connected');

    // 2. Setup Pengguna Terautentikasi untuk Pengujian API
    console.log('\n--- 2. Autentikasi Pengguna untuk Akses API ---');
    const authEmail = 'apitest@fintrack.test';
    const authPassword = 'password123';

    // Coba login dulu, jika belum ada lakukan registrasi
    let token;
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: authEmail, password: authPassword })
    });

    if (loginRes.ok) {
      const loginData = await loginRes.json();
      token = loginData.token;
    } else {
      const regRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'API Tester', email: authEmail, password: authPassword })
      });
      const regData = await regRes.json();
      token = regData.token;
    }

    assert('Token autentikasi berhasil diperoleh', typeof token === 'string');
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    // 3. Test GET /api/transactions
    console.log('\n--- 3. Uji GET /api/transactions ---');
    const listRes1 = await fetch(`${BASE_URL}/transactions`, { headers: authHeaders });
    const listData1 = await listRes1.json();
    assert('GET Transactions Status 200', listRes1.status === 200);
    assert('Array data transaksi valid', Array.isArray(listData1.data));

    // 4. Test POST /api/transactions (Valid Income)
    console.log('\n--- 4. Uji POST /api/transactions (Income Valid) ---');
    const newIncome = {
      title: 'Gaji Bulanan Software Engineer',
      amount: 15000000,
      type: 'income',
      category: 'salary',
      wallet: 'bca',
      date: '2026-10-01',
      description: 'Transfer payroll bulanan'
    };
    const postRes1 = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(newIncome)
    });
    const postData1 = await postRes1.json();
    assert('POST Income Status 201', postRes1.status === 201);
    assert('Created transaction memiliki id', typeof postData1.data?.id === 'string');
    const createdIncomeId = postData1.data?.id;

    // 5. Test POST /api/transactions (Valid Expense)
    console.log('\n--- 5. Uji POST /api/transactions (Expense Valid) ---');
    const newExpense = {
      title: 'Belanja Mingguan Supermarket',
      amount: 750000,
      type: 'expense',
      category: 'food',
      wallet: 'gopay',
      date: '2026-10-05',
      description: 'Bahan masakan dan sayuran'
    };
    const postRes2 = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(newExpense)
    });
    const postData2 = await postRes2.json();
    assert('POST Expense Status 201', postRes2.status === 201);
    const createdExpenseId = postData2.data?.id;

    // 6. Test POST /api/transactions (Invalid Validation Test)
    console.log('\n--- 6. Uji Validasi Input (Penolakan Data Invalid) ---');
    const invalidPayload = {
      title: '', // Kosong!
      amount: -50000, // Negatif!
      type: 'invalid_type' // Tipe salah!
    };
    const invalidRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(invalidPayload)
    });
    assert('Penolakan Bad Request 400', invalidRes.status === 400);

    // 7. Test GET /api/transactions/:id
    console.log('\n--- 7. Uji GET /api/transactions/:id ---');
    const getSingleRes = await fetch(`${BASE_URL}/transactions/${createdIncomeId}`, { headers: authHeaders });
    const getSingleData = await getSingleRes.json();
    assert('GET By ID Status 200', getSingleRes.status === 200);
    assert('Cocok dengan ID yang dibuat', getSingleData.data?.id === createdIncomeId);

    // 8. Test GET /api/transactions/:id (Not Found)
    console.log('\n--- 8. Uji GET By ID yang Tidak Ada (404) ---');
    const notFoundGetRes = await fetch(`${BASE_URL}/transactions/non-existent-uuid-999`, { headers: authHeaders });
    assert('Respons 404 Not Found', notFoundGetRes.status === 404);

    // 9. Test PUT /api/transactions/:id (Update)
    console.log('\n--- 9. Uji PUT /api/transactions/:id (Update) ---');
    const updatePayload = {
      title: 'Gaji Bulanan Senior Software Engineer (Revisi)',
      amount: 16000000
    };
    const putRes = await fetch(`${BASE_URL}/transactions/${createdIncomeId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(updatePayload)
    });
    const putData = await putRes.json();
    assert('PUT Status 200', putRes.status === 200);
    assert('Nominal terupdate ke 16000000', putData.data?.amount === 16000000);
    assert('Judul terupdate', putData.data?.title === updatePayload.title);

    // 10. Test DELETE /api/transactions/:id
    console.log('\n--- 10. Uji DELETE /api/transactions/:id ---');
    const deleteRes = await fetch(`${BASE_URL}/transactions/${createdExpenseId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const deleteData = await deleteRes.json();
    assert('DELETE Status 200', deleteRes.status === 200);
    assert('ID yang dihapus cocok', deleteData.data?.id === createdExpenseId);

    // 11. Test DELETE /api/transactions/:id (Already deleted / Not Found)
    console.log('\n--- 11. Uji DELETE ID yang Tidak Ada (404) ---');
    const deleteNotFoundRes = await fetch(`${BASE_URL}/transactions/${createdExpenseId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert('DELETE 404 Not Found', deleteNotFoundRes.status === 404);

    // 12. Test GET /api/transactions setelah mutasi
    console.log('\n--- 12. Uji Verifikasi Akhir Transaksi ---');
    const listFinalRes = await fetch(`${BASE_URL}/transactions`, { headers: authHeaders });
    const listFinalData = await listFinalRes.json();
    assert('Data transaksi pengguna valid', Array.isArray(listFinalData.data));

    console.log('\n=======================================');
    console.log(`📊 RINGKASAN TEST: ${passed} PASSED, ${failed} FAILED`);
    console.log('=======================================');
  } catch (err) {
    console.error('Fatal error saat pengujian:', err);
  }
}

runTests();
