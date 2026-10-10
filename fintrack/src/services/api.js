/**
 * Service API Klien FinTrack
 * Menghubungkan Frontend ke Backend REST API Node.js + Express
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Helper untuk menyusun header autentikasi
 */
const getAuthHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// ==========================================
// 1. ENDPOINT KESEHATAN SERVER
// ==========================================
export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check gagal dengan status ${response.status}`);
  }
  return response.json();
}

// ==========================================
// 2. ENDPOINT AUTENTIKASI PENGGUNA (AUTH)
// ==========================================

/**
 * Registrasi pengguna baru
 */
export async function registerApi({ name, email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Registrasi gagal (Status ${response.status})`);
  }
  return data;
}

/**
 * Login pengguna & dapatkan Bearer Token
 */
export async function loginApi({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Login gagal (Status ${response.status})`);
  }
  return data;
}

/**
 * Verifikasi token aktif & ambil profil user
 */
export async function getMeApi(token) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(token)
  });

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
export async function getTransactionsApi(params = {}, token) {
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
  const response = await fetch(url, {
    headers: getAuthHeaders(token)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal mengambil transaksi (Status ${response.status})`);
  }
  
  return response.json();
}

/**
 * Mengambil satu transaksi berdasarkan ID
 */
export async function getTransactionByIdApi(id, token) {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
    headers: getAuthHeaders(token)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Transaksi tidak ditemukan (Status ${response.status})`);
  }
  return response.json();
}

/**
 * Menambahkan transaksi baru ke backend & database
 */
export async function createTransactionApi(transactionData, token) {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(transactionData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal menyimpan transaksi (Status ${response.status})`);
  }

  return response.json();
}

/**
 * Memperbarui transaksi (PUT)
 */
export async function updateTransactionApi(id, updateData, token) {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(updateData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal memperbarui transaksi (Status ${response.status})`);
  }

  return response.json();
}

/**
 * Menghapus transaksi (DELETE)
 */
export async function deleteTransactionApi(id, token) {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal menghapus transaksi (Status ${response.status})`);
  }

  return response.json();
}

// ==========================================
// 4. ENDPOINT DOMPET & REKENING (WALLETS)
// ==========================================

export async function getWalletsApi(token) {
  const response = await fetch(`${API_BASE_URL}/wallets`, {
    headers: getAuthHeaders(token)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal mengambil daftar dompet (Status ${response.status})`);
  }
  return response.json();
}

export async function getWalletByIdApi(id, token) {
  const response = await fetch(`${API_BASE_URL}/wallets/${id}`, {
    headers: getAuthHeaders(token)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Dompet tidak ditemukan (Status ${response.status})`);
  }
  return response.json();
}

export async function createWalletApi(walletData, token) {
  const response = await fetch(`${API_BASE_URL}/wallets`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(walletData)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal membuat dompet baru (Status ${response.status})`);
  }
  return response.json();
}

export async function updateWalletApi(id, updateData, token) {
  const response = await fetch(`${API_BASE_URL}/wallets/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(updateData)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal memperbarui dompet (Status ${response.status})`);
  }
  return response.json();
}

export async function deleteWalletApi(id, token) {
  const response = await fetch(`${API_BASE_URL}/wallets/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal menghapus dompet (Status ${response.status})`);
  }
  return response.json();
}

// ==========================================
// 5. ENDPOINT ALOKASI ANGGARAN (BUDGETS)
// ==========================================

export async function getBudgetsApi(params = {}, token) {
  const query = new URLSearchParams();
  if (params.period) query.set('period', params.period);
  const url = `${API_BASE_URL}/budgets${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: getAuthHeaders(token)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal mengambil daftar anggaran (Status ${response.status})`);
  }
  return response.json();
}

export async function getBudgetByIdApi(id, token) {
  const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
    headers: getAuthHeaders(token)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Anggaran tidak ditemukan (Status ${response.status})`);
  }
  return response.json();
}

export async function createBudgetApi(budgetData, token) {
  const response = await fetch(`${API_BASE_URL}/budgets`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(budgetData)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal mengatur anggaran (Status ${response.status})`);
  }
  return response.json();
}

export async function updateBudgetApi(id, updateData, token) {
  const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(updateData)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal memperbarui anggaran (Status ${response.status})`);
  }
  return response.json();
}

export async function deleteBudgetApi(id, token) {
  const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal menghapus anggaran (Status ${response.status})`);
  }
  return response.json();
}

// ==========================================
// 6. ENDPOINT KATEGORI DINAMIS (CATEGORIES)
// ==========================================

export async function getCategoriesApi(params = {}, token) {
  const query = new URLSearchParams();
  if (params.type && params.type !== 'all') query.set('type', params.type);
  const url = `${API_BASE_URL}/categories${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: getAuthHeaders(token)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal mengambil daftar kategori (Status ${response.status})`);
  }
  return response.json();
}

export async function getCategoryByIdApi(id, token) {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    headers: getAuthHeaders(token)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Kategori tidak ditemukan (Status ${response.status})`);
  }
  return response.json();
}

export async function createCategoryApi(categoryData, token) {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(categoryData)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal membuat kategori baru (Status ${response.status})`);
  }
  return response.json();
}

export async function updateCategoryApi(id, updateData, token) {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(updateData)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal memperbarui kategori (Status ${response.status})`);
  }
  return response.json();
}

export async function deleteCategoryApi(id, token) {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal menghapus kategori (Status ${response.status})`);
  }
  return response.json();
}


