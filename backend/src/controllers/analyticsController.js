import prisma from '../config/prisma.js';

const MONTH_NAMES_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

/**
 * Helper untuk menghitung rentang tanggal berdasarkan filter periode
 */
const getDateRangeForPeriod = (period, customStart, customEnd) => {
  const now = new Date();
  let startDate;
  let endDate;

  switch (period) {
    case 'last_month': {
      // Bulan sebelumnya
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startDate = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    }
    case 'last_3_months': {
      // 3 bulan terakhir (2 bulan lalu sampai akhir bulan ini)
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      startDate = new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    }
    case 'custom': {
      if (customStart) {
        startDate = new Date(customStart);
        if (isNaN(startDate.getTime())) {
          throw new Error('Format "startDate" tidak valid. Gunakan format YYYY-MM-DD.');
        }
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      }

      if (customEnd) {
        endDate = new Date(customEnd);
        if (isNaN(endDate.getTime())) {
          throw new Error('Format "endDate" tidak valid. Gunakan format YYYY-MM-DD.');
        }
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }

      if (startDate > endDate) {
        throw new Error('Parameter "startDate" tidak boleh lebih besar dari "endDate".');
      }
      break;
    }
    case 'all': {
      startDate = new Date(0); // Epoch
      endDate = new Date(now.getFullYear() + 10, 11, 31, 23, 59, 59, 999);
      break;
    }
    case 'this_month':
    default: {
      // Bulan ini (default)
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    }
  }

  return { startDate, endDate };
};

/**
 * GET /api/analytics/summary
 * Mengambil ringkasan analitik komprehensif untuk akun pengguna aktif:
 * - Summary: total saldo dompet riil, pemasukan periode, pengeluaran periode, net, sisa & kelebihan anggaran
 * - Breakdown pengeluaran per kategori beserta persentase
 * - Tren pemasukan vs pengeluaran per bulan
 * - Arus kas harian
 */
export const getAnalyticsSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = 'this_month', startDate: qStart, endDate: qEnd } = req.query;

    let range;
    try {
      range = getDateRangeForPeriod(period, qStart, qEnd);
    } catch (dateErr) {
      return res.status(400).json({
        success: false,
        message: dateErr.message
      });
    }

    const { startDate, endDate } = range;

    // 1. Ambil seluruh transaksi pengguna untuk kalkulasi saldo lifetime dan filter periode
    const allUserTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'asc' }
    });

    // 2. Ambil seluruh dompet milik pengguna
    const userWallets = await prisma.wallet.findMany({
      where: { userId }
    });

    // 3. Ambil seluruh anggaran milik pengguna
    const userBudgets = await prisma.budget.findMany({
      where: { userId }
    });

    // 4. Ambil kategori sistem dan kategori kustom pengguna
    const userCategories = await prisma.category.findMany({
      where: {
        OR: [
          { isSystem: true },
          { userId }
        ]
      }
    });

    // Buat lookup metadata kategori
    const categoryMap = new Map();
    userCategories.forEach((cat) => {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        color: cat.color || '#64748b',
        icon: cat.icon || 'MoreHorizontal'
      });
    });

    // 5. Hitung Saldo Lifetime per Dompet & Total Saldo Seluruh Dompet (tanpa double counting)
    const walletBalanceMap = new Map();
    userWallets.forEach((w) => {
      walletBalanceMap.set(w.id, Number(w.initialBalance || 0));
    });

    allUserTransactions.forEach((tx) => {
      const wId = tx.wallet;
      const amt = Number(tx.amount || 0);
      if (walletBalanceMap.has(wId)) {
        const cur = walletBalanceMap.get(wId);
        if (tx.type === 'income') {
          walletBalanceMap.set(wId, cur + amt);
        } else if (tx.type === 'expense') {
          walletBalanceMap.set(wId, cur - amt);
        }
      }
    });

    let totalBalance = 0;
    const detailedWallets = userWallets.map((w) => {
      const currentBalance = Math.max(0, walletBalanceMap.get(w.id) ?? Number(w.initialBalance || 0));
      totalBalance += currentBalance;
      return {
        id: w.id,
        name: w.name,
        type: w.type,
        color: w.color,
        icon: w.icon,
        balance: currentBalance
      };
    });

    // 6. Filter Transaksi Berdasarkan Periode Terpilih
    const periodTransactions = allUserTransactions.filter((tx) => {
      if (!tx.date) return false;
      const txTime = new Date(tx.date).getTime();
      return txTime >= startDate.getTime() && txTime <= endDate.getTime();
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const expenseByCategory = {};

    periodTransactions.forEach((tx) => {
      const amt = Number(tx.amount || 0);
      if (tx.type === 'income') {
        totalIncome += amt;
      } else if (tx.type === 'expense') {
        totalExpense += amt;
        const catKey = tx.category || 'others_exp';
        expenseByCategory[catKey] = (expenseByCategory[catKey] || 0) + amt;
      }
    });

    const netCashflow = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netCashflow / totalIncome) * 100) : 0;

    // 7. Analisis Anggaran (Budgets) pada Periode Terpilih
    let totalBudget = 0;
    let totalBudgetSpent = 0;
    let exceededBudgetCount = 0;
    let exceededBudgetAmount = 0;

    const budgetAnalysis = userBudgets.map((b) => {
      const limit = Number(b.amount || 0);
      const spent = expenseByCategory[b.categoryId] || 0;
      const remaining = Math.max(0, limit - spent);
      const isExceeded = spent > limit;
      const exceededBy = isExceeded ? spent - limit : 0;

      totalBudget += limit;
      totalBudgetSpent += spent;
      if (isExceeded) {
        exceededBudgetCount += 1;
        exceededBudgetAmount += exceededBy;
      }

      const catMeta = categoryMap.get(b.categoryId) || {
        name: b.categoryId,
        color: '#64748b',
        icon: 'MoreHorizontal'
      };

      return {
        budgetId: b.id,
        categoryId: b.categoryId,
        categoryName: catMeta.name,
        limit,
        spent,
        remaining,
        isExceeded,
        exceededBy,
        percentage: limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0
      };
    });

    const remainingBudget = Math.max(0, totalBudget - totalBudgetSpent);

    // 8. Analisis Kategori Pengeluaran (Category Breakdown)
    const categoryBreakdown = Object.entries(expenseByCategory).map(([catId, spent]) => {
      const catMeta = categoryMap.get(catId) || {
        id: catId,
        name: catId === 'others_exp' ? 'Lain-lain' : catId,
        color: '#64748b',
        icon: 'MoreHorizontal'
      };

      const budgetItem = userBudgets.find((b) => b.categoryId === catId);
      const budgetLimit = budgetItem ? Number(budgetItem.amount || 0) : 0;
      const percentage = totalExpense > 0 ? Number(((spent / totalExpense) * 100).toFixed(1)) : 0;

      return {
        categoryId: catId,
        name: catMeta.name,
        color: catMeta.color,
        icon: catMeta.icon,
        spent,
        percentage,
        budget: budgetLimit,
        isExceeded: budgetLimit > 0 && spent > budgetLimit
      };
    }).sort((a, b) => b.spent - a.spent);

    // 9. Kompilasi Tren Pemasukan vs Pengeluaran per Bulan (6 bulan terakhir)
    const monthlyTrendMap = {};
    const trendMonths = [];
    const trendNow = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(trendNow.getFullYear(), trendNow.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}`;
      monthlyTrendMap[key] = {
        key,
        month: label,
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        income: 0,
        expense: 0,
        net: 0
      };
      trendMonths.push(key);
    }

    allUserTransactions.forEach((tx) => {
      if (!tx.date) return;
      const d = new Date(tx.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyTrendMap[key]) {
        const amt = Number(tx.amount || 0);
        if (tx.type === 'income') {
          monthlyTrendMap[key].income += amt;
        } else if (tx.type === 'expense') {
          monthlyTrendMap[key].expense += amt;
        }
        monthlyTrendMap[key].net = monthlyTrendMap[key].income - monthlyTrendMap[key].expense;
      }
    });

    const monthlyTrend = trendMonths.map((k) => monthlyTrendMap[k]);

    // 10. Arus Kas Harian (Daily Cashflow Trend) dalam Periode
    const dailyMap = {};
    periodTransactions.forEach((tx) => {
      if (!tx.date) return;
      const d = new Date(tx.date);
      if (isNaN(d.getTime())) return;
      const dateKey = d.toISOString().split('T')[0];

      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          formattedDate: `${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()]}`,
          income: 0,
          expense: 0,
          net: 0
        };
      }
      const amt = Number(tx.amount || 0);
      if (tx.type === 'income') {
        dailyMap[dateKey].income += amt;
      } else if (tx.type === 'expense') {
        dailyMap[dateKey].expense += amt;
      }
      dailyMap[dateKey].net = dailyMap[dateKey].income - dailyMap[dateKey].expense;
    });

    const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Kirim respons komprehensif
    return res.status(200).json({
      success: true,
      data: {
        period: {
          type: period,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        summary: {
          totalBalance,
          totalIncome,
          totalExpense,
          netCashflow,
          savingsRate,
          totalBudget,
          totalBudgetSpent,
          remainingBudget,
          exceededBudgetCount,
          exceededBudgetAmount,
          transactionCount: periodTransactions.length
        },
        categoryBreakdown,
        monthlyTrend,
        dailyTrend,
        wallets: detailedWallets,
        budgetAnalysis
      }
    });
  } catch (error) {
    next(error);
  }
};
