import prisma from '../config/prisma.js';

/**
 * Controller Manajemen Alokasi Anggaran (Budgets)
 * Mengisolasi seluruh operasi berdasarkan identitas req.user.id
 */

/**
 * 1. GET /api/budgets - Mengambil daftar anggaran milik pengguna yang sedang login
 */
export const getBudgets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = 'monthly' } = req.query;

    const budgets = await prisma.budget.findMany({
      where: { userId, period },
      orderBy: { createdAt: 'asc' }
    });

    // Ambil seluruh pengeluaran user untuk menghitung realisasi belanja (spent)
    const expenseTransactions = await prisma.transaction.findMany({
      where: { userId, type: 'expense' },
      select: { amount: true, category: true }
    });

    const categorySpentMap = {};
    expenseTransactions.forEach((tx) => {
      const cat = tx.category || 'others_exp';
      categorySpentMap[cat] = (categorySpentMap[cat] || 0) + Number(tx.amount);
    });

    const budgetsWithSpent = budgets.map((b) => {
      const spent = categorySpentMap[b.categoryId] || 0;
      const limit = Number(b.amount);
      const remaining = limit - spent;
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

      return {
        ...b,
        limit, // Alias kompatibilitas UI frontend
        spent,
        remaining,
        percentage
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar anggaran berhasil diambil.',
      data: budgetsWithSpent
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/budgets/:id - Mengambil satu anggaran berdasarkan ID
 */
export const getBudgetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const budget = await prisma.budget.findFirst({
      where: { id, userId }
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Anggaran tidak ditemukan atau bukan milik Anda.'
      });
    }

    // Hitung realisasi pengeluaran untuk kategori ini
    const expenseTransactions = await prisma.transaction.findMany({
      where: { userId, type: 'expense', category: budget.categoryId },
      select: { amount: true }
    });

    const spent = expenseTransactions.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const limit = Number(budget.amount);

    return res.status(200).json({
      success: true,
      message: 'Detail anggaran berhasil diambil.',
      data: {
        ...budget,
        limit,
        spent,
        remaining: limit - spent,
        percentage: limit > 0 ? Math.round((spent / limit) * 100) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /api/budgets - Membuat atau memperbarui alokasi anggaran kategori
 */
export const createBudget = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { categoryId, amount, period = 'monthly' } = req.body;

    if (!categoryId || typeof categoryId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Kategori anggaran (categoryId) wajib diisi.'
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Plafon batas anggaran harus berupa angka non-negatif.'
      });
    }

    const cleanCat = categoryId.trim();
    const cleanPeriod = String(period).trim();

    // Periksa apakah anggaran untuk kategori dan periode ini sudah ada
    const existing = await prisma.budget.findUnique({
      where: {
        userId_categoryId_period: {
          userId,
          categoryId: cleanCat,
          period: cleanPeriod
        }
      }
    });

    if (existing) {
      // Perbarui anggaran jika sudah terdaftar
      const updated = await prisma.budget.update({
        where: { id: existing.id },
        data: { amount: numAmount }
      });

      return res.status(200).json({
        success: true,
        message: `Anggaran kategori "${cleanCat}" berhasil diperbarui.`,
        data: {
          ...updated,
          limit: updated.amount
        }
      });
    }

    const newBudget = await prisma.budget.create({
      data: {
        categoryId: cleanCat,
        amount: numAmount,
        period: cleanPeriod,
        userId
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Anggaran kategori berhasil ditambahkan.',
      data: {
        ...newBudget,
        limit: newBudget.amount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. PUT /api/budgets/:id - Memperbarui nominal plafon anggaran
 */
export const updateBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { amount, period } = req.body;

    const existing = await prisma.budget.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Anggaran tidak ditemukan atau bukan milik Anda.'
      });
    }

    const updatePayload = {};

    if (amount !== undefined) {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Plafon batas anggaran harus berupa angka non-negatif.'
        });
      }
      updatePayload.amount = numAmount;
    }

    if (period !== undefined) {
      updatePayload.period = String(period).trim();
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: updatePayload
    });

    return res.status(200).json({
      success: true,
      message: 'Batas anggaran berhasil diperbarui.',
      data: {
        ...updated,
        limit: updated.amount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. DELETE /api/budgets/:id - Menghapus alokasi anggaran
 */
export const deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.budget.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Anggaran tidak ditemukan atau bukan milik Anda.'
      });
    }

    await prisma.budget.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: `Anggaran kategori "${existing.categoryId}" berhasil dihapus.`
    });
  } catch (error) {
    next(error);
  }
};
