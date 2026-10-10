import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  CATEGORIES,
  WALLETS as INITIAL_WALLETS_DEFAULT,
  INITIAL_BUDGETS as INITIAL_BUDGETS_DEFAULT,
  INITIAL_TRANSACTIONS,
  formatRupiah,
  formatShortDate
} from '../data/initialData';
import {
  getTransactionsApi,
  createTransactionApi,
  updateTransactionApi,
  deleteTransactionApi,
  checkBackendHealth,
  loginApi,
  registerApi,
  getMeApi,
  getWalletsApi,
  createWalletApi,
  updateWalletApi,
  getBudgetsApi,
  createBudgetApi,
  updateBudgetApi,
  deleteBudgetApi,
  getCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi
} from '../services/api';

const FinanceContext = createContext(null);

const STORAGE_KEY_TOKEN = 'fintrack_jwt_token_v1';
const STORAGE_KEY_USER = 'fintrack_user_v1';
const STORAGE_KEY_TX = 'fintrack_transactions_v1';

export function FinanceProvider({ children }) {
  // Navigation & UI State
  const [activePage, setActivePage] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('this_month'); // 'this_month', 'all'
  
  // Status Integrasi Backend API
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Authentication State
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_TOKEN) || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [authLoading, setAuthLoading] = useState(Boolean(token));
  const [authError, setAuthError] = useState(null);

  // Financial Domain States (Disinkronkan dengan Database Backend per User)
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TX);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wallets, setWallets] = useState([]);
  const [budgets, setBudgets] = useState([]);

  // Refs untuk menjaga referensi mutakhir tanpa memicu effect loops
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const userRef = useRef(user);
  userRef.current = user;

  const transactionsRef = useRef(transactions);
  transactionsRef.current = transactions;

  const hasInitializedAuth = useRef(false);

  // Helper untuk formatting kategori dinamis
  const formatCategoryList = (list) => {
    if (!Array.isArray(list) || list.length === 0) {
      return {
        expense: CATEGORIES.expense,
        income: CATEGORIES.income,
        all: [...CATEGORIES.expense, ...CATEGORIES.income]
      };
    }
    const expense = [];
    const income = [];
    const all = [];
    list.forEach((c) => {
      const formatted = {
        ...c,
        bg: c.bg || (c.color ? `${c.color}20` : 'rgba(100,116,139,0.1)'),
        color: c.color || '#64748b',
        icon: c.icon || 'MoreHorizontal'
      };
      all.push(formatted);
      if (c.type === 'expense') {
        expense.push(formatted);
      } else {
        income.push(formatted);
      }
    });
    return {
      expense: expense.length > 0 ? expense : CATEGORIES.expense,
      income: income.length > 0 ? income : CATEGORIES.income,
      all
    };
  };

  const [categories, setCategories] = useState(() => ({
    expense: CATEGORIES.expense,
    income: CATEGORIES.income,
    all: [...CATEGORIES.expense, ...CATEGORIES.income]
  }));

  // Sinkronisasi otomatis auth ke LocalStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [user]);

  useEffect(() => {
    if (token && transactions.length > 0) {
      localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(transactions));
    } else if (!token) {
      localStorage.removeItem(STORAGE_KEY_TX);
    }
  }, [transactions, token]);

  // Logout Function: Bersihkan sesi dan seluruh data finansial dari memori
  const logout = useCallback(() => {
    hasInitializedAuth.current = false;
    setToken(null);
    setUser(null);
    setTransactions([]);
    setWallets([]);
    setBudgets([]);
    setCategories({
      expense: CATEGORIES.expense,
      income: CATEGORIES.income,
      all: [...CATEGORIES.expense, ...CATEGORIES.income]
    });
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TX);
    setIsBackendConnected(false);
  }, []);

  // 1. Muat Transaksi dari Backend
  const loadTransactionsFromBackend = useCallback(async (activeToken) => {
    const authToken = activeToken || tokenRef.current;
    if (!authToken) {
      setTransactions([]);
      return;
    }

    try {
      const result = await getTransactionsApi({}, authToken);
      if (result.success && Array.isArray(result.data)) {
        setTransactions(result.data);
      }
    } catch (err) {
      console.warn('[FinanceContext] Gagal sinkronisasi transaksi:', err.message);
      if (err.message.includes('401') || err.message.includes('Token')) {
        logout();
      }
    }
  }, [logout]);

  // 2. Muat Dompet (Wallets) dari Backend & Inisialisasi Starter jika Kosong
  const loadWalletsFromBackend = useCallback(async (activeToken, currentUser) => {
    const authToken = activeToken || tokenRef.current;
    const targetUser = currentUser || userRef.current;
    if (!authToken) {
      setWallets([]);
      return;
    }

    try {
      const result = await getWalletsApi(authToken);
      if (result.success && Array.isArray(result.data)) {
        // Jika user belum memiliki dompet di DB, buat starter wallets bawaan
        if (result.data.length === 0 && targetUser?.id) {
          const migrationKey = `fintrack_wallets_migrated_${targetUser.id}`;
          if (!localStorage.getItem(migrationKey)) {
            for (const item of INITIAL_WALLETS_DEFAULT) {
              await createWalletApi({
                name: item.name,
                type: item.type,
                initialBalance: item.balance,
                color: item.color,
                icon: item.icon
              }, authToken).catch(() => {});
            }
            localStorage.setItem(migrationKey, 'true');
            // Re-fetch setelah seeding
            const refreshed = await getWalletsApi(authToken);
            if (refreshed.success && Array.isArray(refreshed.data)) {
              setWallets(refreshed.data);
              return;
            }
          }
        }
        setWallets(result.data);
      }
    } catch (err) {
      console.warn('[FinanceContext] Gagal sinkronisasi dompet:', err.message);
    }
  }, []);

  // 3. Muat Anggaran (Budgets) dari Backend & Inisialisasi Starter jika Kosong
  const loadBudgetsFromBackend = useCallback(async (activeToken, currentUser) => {
    const authToken = activeToken || tokenRef.current;
    const targetUser = currentUser || userRef.current;
    if (!authToken) {
      setBudgets([]);
      return;
    }

    try {
      const result = await getBudgetsApi({}, authToken);
      if (result.success && Array.isArray(result.data)) {
        // Jika user belum memiliki anggaran di DB, buat starter budgets bawaan
        if (result.data.length === 0 && targetUser?.id) {
          const migrationKey = `fintrack_budgets_migrated_${targetUser.id}`;
          if (!localStorage.getItem(migrationKey)) {
            for (const item of INITIAL_BUDGETS_DEFAULT) {
              await createBudgetApi({
                categoryId: item.categoryId,
                amount: item.limit,
                period: 'monthly'
              }, authToken).catch(() => {});
            }
            localStorage.setItem(migrationKey, 'true');
            // Re-fetch setelah seeding
            const refreshed = await getBudgetsApi({}, authToken);
            if (refreshed.success && Array.isArray(refreshed.data)) {
              setBudgets(refreshed.data);
              return;
            }
          }
        }
        setBudgets(result.data);
      }
    } catch (err) {
      console.warn('[FinanceContext] Gagal sinkronisasi anggaran:', err.message);
    }
  }, []);

  // 4. Muat Kategori (Categories) dari Backend
  const loadCategoriesFromBackend = useCallback(async (activeToken) => {
    const authToken = activeToken || tokenRef.current;
    if (!authToken) {
      setCategories({
        expense: CATEGORIES.expense,
        income: CATEGORIES.income,
        all: [...CATEGORIES.expense, ...CATEGORIES.income]
      });
      return;
    }

    try {
      const result = await getCategoriesApi({}, authToken);
      if (result.success && Array.isArray(result.data)) {
        setCategories(formatCategoryList(result.data));
      }
    } catch (err) {
      console.warn('[FinanceContext] Gagal sinkronisasi kategori:', err.message);
    }
  }, []);

  // Muat seluruh domain data pengguna yang sedang aktif
  const loadAllUserData = useCallback(async (authToken, currentUser) => {
    setIsLoading(true);
    setApiError(null);
    try {
      await checkBackendHealth();
      await Promise.all([
        loadTransactionsFromBackend(authToken),
        loadWalletsFromBackend(authToken, currentUser),
        loadBudgetsFromBackend(authToken, currentUser),
        loadCategoriesFromBackend(authToken)
      ]);
      setIsBackendConnected(true);
    } catch (err) {
      console.warn('[FinanceContext] Error memuat data pengguna:', err.message);
      setIsBackendConnected(false);
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [loadTransactionsFromBackend, loadWalletsFromBackend, loadBudgetsFromBackend, loadCategoriesFromBackend]);

  // Inisialisasi Sesi Aplikasi saat Dimuat (Hanya berjalan sekali saat mount)
  useEffect(() => {
    if (hasInitializedAuth.current) return;
    hasInitializedAuth.current = true;

    const initAuth = async () => {
      const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (!savedToken) {
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);
      setAuthError(null);
      try {
        const res = await getMeApi(savedToken);
        const userData = res.user || res.data?.user;
        if (userData) {
          setUser(userData);
          setToken(savedToken);
          setIsBackendConnected(true);
          await loadAllUserData(savedToken, userData);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('[FinanceContext] Token tidak valid atau kedaluwarsa:', err.message);
        logout();
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, [loadAllUserData, logout]);

  // Login Handler
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await loginApi({ email, password });
      const userToken = res.token || res.data?.token;
      const userData = res.user || res.data?.user;

      if (userToken && userData) {
        setToken(userToken);
        setUser(userData);
        localStorage.setItem(STORAGE_KEY_TOKEN, userToken);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
        setIsBackendConnected(true);

        await loadAllUserData(userToken, userData);
        return userData;
      }
      throw new Error(res.message || 'Login gagal.');
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Register Handler
  const register = async (name, email, password) => {
    setAuthError(null);
    try {
      const res = await registerApi({ name, email, password });
      const userToken = res.token || res.data?.token;
      const userData = res.user || res.data?.user;

      if (userToken && userData) {
        setToken(userToken);
        setUser(userData);
        localStorage.setItem(STORAGE_KEY_TOKEN, userToken);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
        setIsBackendConnected(true);

        // Bersihkan data lokal lama milik sesi sebelumnya
        setTransactions([]);
        localStorage.removeItem(STORAGE_KEY_TX);

        await loadAllUserData(userToken, userData);
        return userData;
      }
      throw new Error(res.message || 'Registrasi gagal.');
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // --- CRUD TRANSAKSI DENGAN JWT ---
  const addTransaction = async (tx) => {
    try {
      if (token) {
        const res = await createTransactionApi(tx, token);
        if (res.success && res.data) {
          setTransactions((prev) => [res.data, ...prev]);
          // Refresh dompet untuk kalkulasi mutasi
          loadWalletsFromBackend(token, user);
          return res.data;
        }
      }
    } catch (err) {
      console.error('[FinanceContext] Error menambahkan transaksi:', err);
      throw err;
    }

    const fallbackTx = {
      id: 'tx-' + Date.now(),
      date: tx.date || new Date().toISOString().split('T')[0],
      ...tx,
      amount: Number(tx.amount) || 0
    };
    setTransactions((prev) => [fallbackTx, ...prev]);
    return fallbackTx;
  };

  const updateTransaction = async (id, updateData) => {
    try {
      if (token) {
        const res = await updateTransactionApi(id, updateData, token);
        if (res.success && res.data) {
          setTransactions((prev) => prev.map((t) => (t.id === id ? res.data : t)));
          loadWalletsFromBackend(token, user);
          return res.data;
        }
      }
    } catch (err) {
      console.error('[FinanceContext] Error memperbarui transaksi:', err);
      throw err;
    }

    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updateData, amount: Number(updateData.amount || t.amount) } : t))
    );
  };

  const deleteTransaction = async (id) => {
    try {
      if (token) {
        await deleteTransactionApi(id, token);
      }
    } catch (err) {
      console.error('[FinanceContext] Error menghapus transaksi:', err);
      throw err;
    }

    setTransactions((prev) => prev.filter((item) => item.id !== id));
    loadWalletsFromBackend(token, user);
  };

  // --- CRUD DOMPET (WALLETS) DENGAN JWT ---
  const addWallet = async (walletData) => {
    if (!token) throw new Error('Pengguna belum terautentikasi.');
    const res = await createWalletApi(walletData, token);
    if (res.success && res.data) {
      setWallets((prev) => [...prev, res.data]);
      return res.data;
    }
    throw new Error(res.message || 'Gagal menambahkan dompet.');
  };

  const updateWallet = async (id, updateData) => {
    if (!token) throw new Error('Pengguna belum terautentikasi.');
    const res = await updateWalletApi(id, updateData, token);
    if (res.success && res.data) {
      setWallets((prev) => prev.map((w) => (w.id === id ? res.data : w)));
      return res.data;
    }
    throw new Error(res.message || 'Gagal memperbarui dompet.');
  };

  const deleteWallet = async (id) => {
    if (!token) throw new Error('Pengguna belum terautentikasi.');
    const res = await deleteWalletApi(id, token);
    if (res.success) {
      setWallets((prev) => prev.filter((w) => w.id !== id));
      return true;
    }
    throw new Error(res.message || 'Gagal menghapus dompet.');
  };

  // --- CRUD ANGGARAN (BUDGETS) DENGAN JWT ---
  const updateBudget = async (categoryId, newLimit) => {
    const numLimit = parseFloat(newLimit) || 0;
    try {
      if (token) {
        const res = await createBudgetApi({
          categoryId,
          amount: numLimit,
          period: 'monthly'
        }, token);
        if (res.success && res.data) {
          setBudgets((prev) => {
            const exists = prev.find((b) => b.categoryId === categoryId);
            if (exists) {
              return prev.map((b) => (b.categoryId === categoryId ? { ...b, limit: numLimit, amount: numLimit } : b));
            }
            return [...prev, { ...res.data, limit: numLimit }];
          });
          return res.data;
        }
      }
    } catch (err) {
      console.error('[FinanceContext] Error menyimpan anggaran:', err);
      throw err;
    }

    // Fallback lokal jika offline
    setBudgets((prev) => {
      const exists = prev.find((b) => b.categoryId === categoryId);
      if (exists) {
        return prev.map((b) => (b.categoryId === categoryId ? { ...b, limit: numLimit } : b));
      }
      return [...prev, { categoryId, limit: numLimit }];
    });
  };

  const deleteBudget = async (id) => {
    if (token) {
      await deleteBudgetApi(id, token);
    }
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  // --- CRUD KATEGORI DINAMIS DENGAN JWT ---
  const addCategory = async (catData) => {
    if (!token) throw new Error('Pengguna belum terautentikasi.');
    const res = await createCategoryApi(catData, token);
    if (res.success && res.data) {
      await loadCategoriesFromBackend(token);
      return res.data;
    }
    throw new Error(res.message || 'Gagal menambahkan kategori.');
  };

  const updateCategory = async (id, updateData) => {
    if (!token) throw new Error('Pengguna belum terautentikasi.');
    const res = await updateCategoryApi(id, updateData, token);
    if (res.success && res.data) {
      await loadCategoriesFromBackend(token);
      return res.data;
    }
    throw new Error(res.message || 'Gagal memperbarui kategori.');
  };

  const deleteCategory = async (id) => {
    if (!token) throw new Error('Pengguna belum terautentikasi.');
    const res = await deleteCategoryApi(id, token);
    if (res.success) {
      await loadCategoriesFromBackend(token);
      return true;
    }
    throw new Error(res.message || 'Gagal menghapus kategori.');
  };

  // Query transaksi langsung dari database backend dengan filter & pagination
  const fetchFilteredTransactions = useCallback(async (params = {}) => {
    const currentToken = tokenRef.current;
    if (!currentToken) {
      const fallbackList = transactionsRef.current || [];
      return {
        data: fallbackList,
        pagination: { page: 1, limit: 10, total: fallbackList.length, totalPages: Math.ceil(fallbackList.length / 10) || 1 }
      };
    }
    try {
      const res = await getTransactionsApi(params, currentToken);
      return {
        data: res.data || [],
        pagination: res.pagination || {
          page: 1,
          limit: 10,
          total: (res.data || []).length,
          totalPages: 1
        }
      };
    } catch (err) {
      console.error('[FinanceContext] Gagal mengambil transaksi berfilter:', err);
      throw err;
    }
  }, []);

  // Reset ke default
  const resetToDefaultData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setWallets(INITIAL_WALLETS_DEFAULT);
    setBudgets(INITIAL_BUDGETS_DEFAULT);
    setCategories({
      expense: CATEGORIES.expense,
      income: CATEGORIES.income,
      all: [...CATEGORIES.expense, ...CATEGORIES.income]
    });
    localStorage.removeItem(STORAGE_KEY_TX);
  };

  // Perhitungan Dompet Dinamis: Menghitung saldo awal + mutasi riil transaksi
  const dynamicWallets = useMemo(() => {
    const baseList = wallets.length > 0 ? wallets : INITIAL_WALLETS_DEFAULT;

    return baseList.map((w) => {
      let income = 0;
      let expense = 0;

      transactions.forEach((tx) => {
        const wKey = tx.walletId || tx.wallet;
        if (wKey === w.id || (wKey && w.name && wKey.toLowerCase() === w.name.toLowerCase())) {
          if (tx.type === 'income') {
            income += Number(tx.amount || 0);
          } else {
            expense += Number(tx.amount || 0);
          }
        }
      });

      const currentBalance = Math.max(0, Number(w.initialBalance ?? w.balance ?? 0) + income - expense);

      return {
        ...w,
        balance: currentBalance,
        currentBalance
      };
    });
  }, [wallets, transactions]);

  // Kalkulasi Metrik Finansial (Bebas magic number, 100% konsisten)
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
    const totalBalance = dynamicWallets.reduce((sum, w) => sum + w.balance, 0);

    const expenseByCategoryMap = {};
    transactions
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => {
        const catKey = tx.categoryId || tx.category || 'others_exp';
        expenseByCategoryMap[catKey] = (expenseByCategoryMap[catKey] || 0) + Number(tx.amount);
      });

    const activeExpenseCategories = categories.expense && categories.expense.length > 0
      ? categories.expense
      : CATEGORIES.expense;

    const expenseCategoryData = activeExpenseCategories.map((cat) => {
      const spent = expenseByCategoryMap[cat.id] || 0;
      const budgetObj = budgets.find((b) => b.categoryId === cat.id);
      const limit = budgetObj ? Number(budgetObj.limit ?? budgetObj.amount ?? 0) : 0;
      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        bg: cat.bg,
        icon: cat.icon,
        spent,
        budget: limit,
        limit,
        percentage: totalExpense > 0 ? Math.round((spent / totalExpense) * 100) : 0
      };
    }).sort((a, b) => b.spent - a.spent);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const trendMap = {};

    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (isNaN(d.getTime())) return;
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (!trendMap[key]) {
        trendMap[key] = { month: key, income: 0, expense: 0, timestamp: d.getTime() };
      }
      if (tx.type === 'income') {
        trendMap[key].income += Number(tx.amount);
      } else {
        trendMap[key].expense += Number(tx.amount);
      }
    });

    let trendChartData = Object.values(trendMap).sort((a, b) => a.timestamp - b.timestamp);
    if (trendChartData.length === 0) {
      trendChartData = [
        { month: 'Okt 2026', income: totalIncome, expense: totalExpense },
      ];
    }

    return {
      totalBalance,
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      expenseCategoryData,
      trendChartData
    };
  }, [transactions, budgets, dynamicWallets, categories]);

  const value = {
    // Auth State & Actions
    user,
    token,
    isAuthenticated: Boolean(token && user),
    authLoading,
    authError,
    login,
    register,
    logout,

    // Finance & UI State
    transactions,
    budgets,
    categories,
    allCategories: categories.all || [...categories.expense, ...categories.income],
    wallets: dynamicWallets,
    rawWallets: wallets,
    activePage,
    setActivePage,
    isAddModalOpen,
    setIsAddModalOpen,
    periodFilter,
    setPeriodFilter,
    isLoading,
    isBackendConnected,
    apiError,

    // Refresh Handlers
    refreshTransactions: () => loadTransactionsFromBackend(),
    refreshWallets: () => loadWalletsFromBackend(token, user),
    refreshBudgets: () => loadBudgetsFromBackend(token, user),
    refreshCategories: () => loadCategoriesFromBackend(token),
    loadAllUserData: () => loadAllUserData(token, user),

    // Filter & Paginated Fetcher
    fetchFilteredTransactions,

    // Mutation Handlers
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addWallet,
    updateWallet,
    deleteWallet,
    updateBudget,
    deleteBudget,
    addCategory,
    updateCategory,
    deleteCategory,
    resetToDefaultData,

    // Calculated Metrics & Helpers
    metrics,
    formatRupiah,
    formatShortDate
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
