/**
 * Service API Klien FinTrack
 * Menghubungkan Frontend ke Backend REST API Node.js + Express
 * Tahap 5: Keamanan Sesi, Access Token in-Memory, HttpOnly Refresh Cookie, CSRF, & Automatic Retry
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// State Token & Sesi HANYA berada di memori browser (tidak disimpan di localStorage)
let inMemoryAccessToken = null;
let inMemoryCsrfToken = null;
let refreshPromise = null; // Menjamin proses refresh tunggal yang terurut (mencegah refresh ganda paralel)
let onUnauthorizedCallback = null;

export const setAccessToken = (token) => {
  inMemoryAccessToken = token || null;
};

export const getAccessToken = () => inMemoryAccessToken;

export const setCsrfToken = (csrf) => {
  inMemoryCsrfToken = csrf || null;
};

export const getCsrfToken = () => inMemoryCsrfToken;

export const setOnUnauthorized = (callback) => {
  onUnauthorizedCallback = callback;
};

/**
 * Helper untuk membaca token CSRF dari cookie dokumen jika tersedia
 */
const getCsrfTokenFromCookie = () => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)fintrack_csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Helper untuk menyusun header request
 */
const buildHeaders = (token, extraHeaders = {}) => {
  const activeToken = token || inMemoryAccessToken;
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...extraHeaders
  };

  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  const csrf = inMemoryCsrfToken || getCsrfTokenFromCookie();
  if (csrf) {
    headers['X-CSRF-Token'] = csrf;
  }

  return headers;
};

/**
 * Wrapper Fetch Terproteksi dengan:
 * - Penyisipan Bearer Access Token in-memory
 * - Sertakan credentials (HttpOnly cookie)
 * - Penanganan otomatis 401 via Refresh Token
 * - Serialized refresh queue untuk mencegah lonjakan request bersamaan
 */
export async function fetchWithAuth(url, options = {}, overrideToken = null) {
  const headers = buildHeaders(overrideToken, options.headers);

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
  } catch (err) {
    throw new Error('Gagal terhubung ke server backend. Pastikan server backend sedang aktif.');
  }

  // Jika response 401 dan bukan endpoint login/refresh/register, coba auto-refresh token
  if (response.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/refresh') && !url.includes('/auth/register')) {
    try {
      const refreshResult = await refreshApi();
      const newAccessToken = refreshResult.token;

      // Ulangi request asli dengan access token baru
      const retryHeaders = buildHeaders(newAccessToken, options.headers);
      response = await fetch(url, {
        ...options,
        headers: retryHeaders,
        credentials: 'include'
      });
    } catch (refreshErr) {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      throw refreshErr;
    }
  }

  return response;
}

// ==========================================
// 1. ENDPOINT KESEHATAN SERVER
// ==========================================
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Health check gagal dengan status ${response.status}`);
    }
    return response.json();
  } catch (err) {
    throw new Error('Gagal terhubung ke server backend. Pastikan server backend sedang aktif.');
  }
}

// ==========================================
// 2. ENDPOINT AUTENTIKASI PENGGUNA (AUTH)
// ==========================================

/**
 * Registrasi pengguna baru
 */
export async function registerApi({ name, email, password }) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ name, email, password }),
      credentials: 'include'
    });
  } catch (err) {
    throw new Error('Gagal terhubung ke server backend. Pastikan server backend sedang aktif.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Registrasi gagal (Status ${response.status})`);
  }

  if (data.token) setAccessToken(data.token);
  if (data.csrfToken) setCsrfToken(data.csrfToken);

  return data;
}

/**
 * Login pengguna & dapatkan Access Token (in-memory) serta pasang HttpOnly Refresh Cookie
 */
export async function loginApi({ email, password }) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
  } catch (err) {
    throw new Error('Gagal terhubung ke server backend. Pastikan server backend sedang aktif.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Login gagal (Status ${response.status})`);
  }

  if (data.token) setAccessToken(data.token);
  if (data.csrfToken) setCsrfToken(data.csrfToken);

  return data;
}

/**
 * Refresh Access Token menggunakan HttpOnly Cookie secara terurut (serialized lock)
 */
export async function refreshApi() {
  // Jika sedang ada refresh yang berjalan, request lain menunggu promise yang sama
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const headers = buildHeaders(null);
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers,
          credentials: 'include'
        });
      } catch (err) {
        throw new Error('Gagal terhubung ke server backend.');
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAccessToken(null);
        setCsrfToken(null);
        throw new Error(data.message || 'Sesi telah kedaluwarsa. Silakan login kembali.');
      }

      if (data.token) setAccessToken(data.token);
      if (data.csrfToken) setCsrfToken(data.csrfToken);

      return data;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Logout pengguna: Cabut sesi di database dan bersihkan cookie HttpOnly
 */
export async function logoutApi() {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: buildHeaders(),
      credentials: 'include'
    });
  } catch (err) {
    // Abaikan kegagalan jaringan saat logout agar pembersihan memori lokal tetap tuntas
  } finally {
    setAccessToken(null);
    setCsrfToken(null);
  }
}

/**
 * Verifikasi token aktif & ambil profil user
 */
export async function getMeApi(token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`, {}, token);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Sesi telah berakhir.');
  }
  return data;
}

// ==========================================
// 3. ENDPOINT TRANSAKSI (PROTECTED)
// ==========================================

/**
 * Mengambil daftar transaksi milik pengguna yang sedang login
 * Mendukung filter (type, category, wallet, startDate, endDate, search) dan paginasi (page, limit)
 */
export async function getTransactionsApi(params = {}, token = null) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', params.page);
  if (params.limit !== undefined) query.set('limit', params.limit);
  if (params.type && params.type !== 'all') query.set('type', params.type);
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.wallet && params.wallet !== 'all') query.set('wallet', params.wallet);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.search && params.search.trim()) query.set('search', params.search.trim());
  if (params.sortBy) query.set('sortBy', params.sortBy);

  const url = `${API_BASE_URL}/transactions${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetchWithAuth(url, {}, token);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal mengambil transaksi (Status ${response.status})`);
  }
  
  return response.json();
}

/**
 * Mengambil satu transaksi berdasarkan ID
 */
export async function getTransactionByIdApi(id, token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/transactions/${id}`, {}, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Transaksi tidak ditemukan (Status ${response.status})`);
  }
  return response.json();
}

/**
 * Menambahkan transaksi baru ke backend & database
 */
export async function createTransactionApi(transactionData, token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    body: JSON.stringify(transactionData)
  }, token);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal menyimpan transaksi (Status ${response.status})`);
  }

  return response.json();
}

/**
 * Memperbarui transaksi (PUT)
 */
export async function updateTransactionApi(id, updateData, token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  }, token);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal memperbarui transaksi (Status ${response.status})`);
  }

  return response.json();
}

/**
 * Menghapus transaksi (DELETE)
 */
export async function deleteTransactionApi(id, token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/transactions/${id}`, {
    method: 'DELETE'
  }, token);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal menghapus transaksi (Status ${response.status})`);
  }

  return response.json();
}

// ==========================================
// 4. ENDPOINT DOMPET & REKENING (WALLETS)
// ==========================================

export async function getWalletsApi(token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/wallets`, {}, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal mengambil daftar dompet (Status ${response.status})`);
  }
  return response.json();
}

export async function getWalletByIdApi(id, token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/wallets/${id}`, {}, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Dompet tidak ditemukan (Status ${response.status})`);
  }
  return response.json();
}

export async function createWalletApi(walletData, token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/wallets`, {
    method: 'POST',
    body: JSON.stringify(walletData)
  }, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal membuat dompet baru (Status ${response.status})`);
  }
  return response.json();
}

export async function updateWalletApi(id, updateData, token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/wallets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  }, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal memperbarui dompet (Status ${response.status})`);
  }
  return response.json();
}

export async function deleteWalletApi(id, token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/wallets/${id}`, {
    method: 'DELETE'
  }, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal menghapus dompet (Status ${response.status})`);
  }
  return response.json();
}

// ==========================================
// 5. ENDPOINT ALOKASI ANGGARAN (BUDGETS)
// ==========================================

export async function getBudgetsApi(params = {}, token = null) {
  const query = new URLSearchParams();
  if (params.period) query.set('period', params.period);
  const url = `${API_BASE_URL}/budgets${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetchWithAuth(url, {}, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal mengambil daftar anggaran (Status ${response.status})`);
  }
  return response.json();
}

export async function getBudgetByIdApi(id, token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/budgets/${id}`, {}, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Anggaran tidak ditemukan (Status ${response.status})`);
  }
  return response.json();
}

export async function createBudgetApi(budgetData, token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/budgets`, {
    method: 'POST',
    body: JSON.stringify(budgetData)
  }, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal mengatur anggaran (Status ${response.status})`);
  }
  return response.json();
}

export async function updateBudgetApi(id, updateData, token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/budgets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  }, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal memperbarui anggaran (Status ${response.status})`);
  }
  return response.json();
}

export async function deleteBudgetApi(id, token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/budgets/${id}`, {
    method: 'DELETE'
  }, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal menghapus anggaran (Status ${response.status})`);
  }
  return response.json();
}

// ==========================================
// 6. ENDPOINT KATEGORI DINAMIS (CATEGORIES)
// ==========================================

export async function getCategoriesApi(params = {}, token = null) {
  const query = new URLSearchParams();
  if (params.type && params.type !== 'all') query.set('type', params.type);
  const url = `${API_BASE_URL}/categories${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetchWithAuth(url, {}, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal mengambil daftar kategori (Status ${response.status})`);
  }
  return response.json();
}

export async function getCategoryByIdApi(id, token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/categories/${id}`, {}, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Kategori tidak ditemukan (Status ${response.status})`);
  }
  return response.json();
}

export async function createCategoryApi(categoryData, token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/categories`, {
    method: 'POST',
    body: JSON.stringify(categoryData)
  }, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal membuat kategori baru (Status ${response.status})`);
  }
  return response.json();
}

export async function updateCategoryApi(id, updateData, token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  }, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal memperbarui kategori (Status ${response.status})`);
  }
  return response.json();
}

export async function deleteCategoryApi(id, token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE'
  }, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal menghapus kategori (Status ${response.status})`);
  }
  return response.json();
}

// ==========================================
// 7. ENDPOINT EXPORT & IMPORT DATA (TAHAP 6)
// ==========================================

/**
 * Ekspor data transaksi ke berkas CSV dengan filter dinamis
 */
export async function exportTransactionsCsvApi(params = {}, token = null) {
  const query = new URLSearchParams();
  if (params.type && params.type !== 'all') query.set('type', params.type);
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.wallet && params.wallet !== 'all') query.set('wallet', params.wallet);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.search) query.set('search', params.search);

  const url = `${API_BASE_URL}/data/export/csv${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetchWithAuth(url, {}, token);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal mengekspor CSV (Status ${response.status})`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  let filename = `fintrack-transaksi-${new Date().toISOString().split('T')[0]}.csv`;
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) filename = match[1];
  }

  return { blob, filename };
}

/**
 * Unduh cadangan lengkap akun pengguna aktif dalam format JSON
 */
export async function exportBackupJsonApi(token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/data/export/json`, {}, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal mengunduh cadangan JSON (Status ${response.status})`);
  }
  return response.json();
}

/**
 * Impor & pulihkan data cadangan JSON dengan transaksi database atomik
 */
export async function importBackupJsonApi(backupPayload, mode = 'merge', token = null) {
  const response = await fetchWithAuth(`${API_BASE_URL}/data/import/json`, {
    method: 'POST',
    body: JSON.stringify({
      ...backupPayload,
      mode
    })
  }, token);

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Gagal memulihkan cadangan data (Status ${response.status})`);
  }
  return data;
}

// ==========================================
// 7. ENDPOINT ANALITIK & DASHBOARD (PROTECTED)
// ==========================================

/**
 * Mengambil ringkasan analitik komprehensif, metrik periode, breakdown kategori, tren bulanan dan harian
 */
export async function getAnalyticsSummaryApi(params = {}, token = null) {
  const query = new URLSearchParams();
  if (params.period) query.set('period', params.period);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const url = `${API_BASE_URL}/analytics/summary${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetchWithAuth(url, {}, token);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal mengambil data analitik (Status ${response.status})`);
  }

  return response.json();
}


