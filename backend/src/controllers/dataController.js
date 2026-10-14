import prisma from '../config/prisma.js';
import { generateTransactionsCsv } from '../utils/csvUtils.js';

// Batas aman maksimum data impor untuk mencegah Denial of Service / memori jebol
const MAX_IMPORT_TRANSACTIONS = 5000;
const MAX_IMPORT_WALLETS = 100;
const MAX_IMPORT_BUDGETS = 100;
const MAX_IMPORT_CATEGORIES = 100;

/**
 * 1. GET /api/data/export/csv
 * Mengekspor riwayat transaksi milik pengguna yang sedang login ke format CSV
 */
export const exportTransactionsCsv = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, category, wallet, startDate, endDate, search } = req.query;

    const where = { userId };

    // Filter Tipe Transaksi
    if (type && type !== 'all') {
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Parameter filter tipe harus berupa "income" atau "expense".'
        });
      }
      where.type = type;
    }

    // Filter Kategori
    if (category && category !== 'all') {
      where.category = category;
    }

    // Filter Dompet
    if (wallet && wallet !== 'all') {
      where.wallet = wallet;
    }

    // Filter Rentang Tanggal
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Format startDate tidak valid. Gunakan format YYYY-MM-DD.'
          });
        }
        start.setUTCHours(0, 0, 0, 0);
        where.date.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Format endDate tidak valid. Gunakan format YYYY-MM-DD.'
          });
        }
        end.setUTCHours(23, 59, 59, 999);
        where.date.lte = end;
      }

      if (where.date.gte && where.date.lte && where.date.gte > where.date.lte) {
        return res.status(400).json({
          success: false,
          message: 'startDate tidak boleh lebih besar dari endDate.'
        });
      }
    }

    // Filter Pencarian Teks
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } }
      ];
    }

    // Ambil transaksi hanya milik pengguna aktif
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const csvData = generateTransactionsCsv(transactions);
    const dateStamp = new Date().toISOString().split('T')[0];
    const filename = `fintrack-transaksi-${dateStamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/data/export/json
 * Mengekspor seluruh data keuangan pengguna aktif ke format JSON cadangan (Backup)
 */
export const exportBackupJson = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Ambil data milik pengguna aktif secara paralel
    const [wallets, categories, budgets, transactions] = await Promise.all([
      prisma.wallet.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.category.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.budget.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' }
      })
    ]);

    // Sanitasi data: hapus passwordHash, internal tokens, atau ID pengguna asing
    const sanitizedWallets = wallets.map((w) => ({
      id: w.id,
      name: w.name,
      type: w.type,
      initialBalance: w.initialBalance,
      color: w.color,
      icon: w.icon,
      createdAt: w.createdAt
    }));

    const sanitizedCategories = categories.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      color: c.color,
      icon: c.icon,
      createdAt: c.createdAt
    }));

    const sanitizedBudgets = budgets.map((b) => ({
      id: b.id,
      categoryId: b.categoryId,
      amount: b.amount,
      period: b.period,
      createdAt: b.createdAt
    }));

    const sanitizedTransactions = transactions.map((t) => ({
      id: t.id,
      title: t.title,
      amount: t.amount,
      type: t.type,
      category: t.category,
      wallet: t.wallet,
      date: t.date,
      description: t.description,
      createdAt: t.createdAt
    }));

    const backupPayload = {
      success: true,
      version: '1.0',
      format: 'FinTrack-Backup-JSON',
      exportedAt: new Date().toISOString(),
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      },
      data: {
        wallets: sanitizedWallets,
        categories: sanitizedCategories,
        budgets: sanitizedBudgets,
        transactions: sanitizedTransactions
      },
      summary: {
        totalWallets: sanitizedWallets.length,
        totalCategories: sanitizedCategories.length,
        totalBudgets: sanitizedBudgets.length,
        totalTransactions: sanitizedTransactions.length
      }
    };

    const dateStamp = new Date().toISOString().split('T')[0];
    const filename = `fintrack-backup-${dateStamp}.json`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).json(backupPayload);
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /api/data/import/json
 * Memulihkan data keuangan dari berkas cadangan JSON dengan transaksi database atomik
 */
export const importBackupJson = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const body = req.body;

    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Format berkas cadangan JSON tidak valid atau berkas kosong.'
      });
    }

    // Dukung format terstruktur { data: { ... } } maupun format langsung { transactions, wallets, ... }
    const importData = body.data || body;
    const mode = body.mode === 'replace' ? 'replace' : 'merge'; // Default: merge (aman)

    const rawTransactions = Array.isArray(importData.transactions) ? importData.transactions : [];
    const rawWallets = Array.isArray(importData.wallets) ? importData.wallets : [];
    const rawCategories = Array.isArray(importData.categories) ? importData.categories : [];
    const rawBudgets = Array.isArray(importData.budgets) ? importData.budgets : [];

    // Validasi Batas Ukuran Data
    if (rawTransactions.length > MAX_IMPORT_TRANSACTIONS) {
      return res.status(400).json({
        success: false,
        message: `Jumlah transaksi melebihi batas maksimum (${MAX_IMPORT_TRANSACTIONS} item).`
      });
    }
    if (rawWallets.length > MAX_IMPORT_WALLETS || rawCategories.length > MAX_IMPORT_CATEGORIES || rawBudgets.length > MAX_IMPORT_BUDGETS) {
      return res.status(400).json({
        success: false,
        message: 'Jumlah dompet, kategori, atau anggaran melebihi batas wajar.'
      });
    }

    if (rawTransactions.length === 0 && rawWallets.length === 0 && rawBudgets.length === 0 && rawCategories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data valid (transaksi, dompet, anggaran, atau kategori) yang ditemukan dalam berkas impor.'
      });
    }

    // 1. Validasi Ketat Transaksi
    for (let i = 0; i < rawTransactions.length; i++) {
      const tx = rawTransactions[i];
      if (!tx.title || typeof tx.title !== 'string' || tx.title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: `Transaksi pada indeks ${i} memiliki judul yang tidak valid.`
        });
      }
      if (tx.title.length > 200) {
        return res.status(400).json({
          success: false,
          message: `Judul transaksi pada indeks ${i} terlalu panjang (maksimal 200 karakter).`
        });
      }
      const amt = Number(tx.amount);
      if (typeof amt !== 'number' || isNaN(amt) || !isFinite(amt) || amt <= 0) {
        return res.status(400).json({
          success: false,
          message: `Transaksi "${tx.title}" memiliki nominal tidak valid (harus angka positif > 0).`
        });
      }
      if (!['income', 'expense'].includes(tx.type)) {
        return res.status(400).json({
          success: false,
          message: `Transaksi "${tx.title}" memiliki tipe tidak valid (harus "income" atau "expense").`
        });
      }
      const d = new Date(tx.date);
      if (isNaN(d.getTime())) {
        return res.status(400).json({
          success: false,
          message: `Transaksi "${tx.title}" memiliki format tanggal tidak valid.`
        });
      }
      const rawCat = tx.category || tx.categoryId;
      if (rawCat && typeof rawCat !== 'string') {
        return res.status(400).json({
          success: false,
          message: `Transaksi "${tx.title}" memiliki referensi kategori yang tidak valid.`
        });
      }
    }

    // 2. Validasi Kategori
    for (let i = 0; i < rawCategories.length; i++) {
      const c = rawCategories[i];
      if (!c.name || typeof c.name !== 'string' || c.name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: `Kategori pada indeks ${i} memiliki nama tidak valid (minimal 2 karakter).`
        });
      }
      if (!['income', 'expense'].includes(c.type)) {
        return res.status(400).json({
          success: false,
          message: `Kategori "${c.name}" memiliki tipe tidak valid.`
        });
      }
    }

    // 3. Validasi Dompet
    for (let i = 0; i < rawWallets.length; i++) {
      const w = rawWallets[i];
      if (!w.name || typeof w.name !== 'string' || w.name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: `Dompet pada indeks ${i} memiliki nama tidak valid.`
        });
      }
      const balance = Number(w.initialBalance ?? w.balance ?? 0);
      if (isNaN(balance) || balance < 0) {
        return res.status(400).json({
          success: false,
          message: `Dompet "${w.name}" memiliki saldo awal tidak valid.`
        });
      }
    }

    // 4. Validasi Anggaran
    for (let i = 0; i < rawBudgets.length; i++) {
      const b = rawBudgets[i];
      const limit = Number(b.amount ?? b.limit ?? 0);
      if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({
          success: false,
          message: `Anggaran pada indeks ${i} memiliki limit tidak valid (harus > 0).`
        });
      }
      if (!b.categoryId || typeof b.categoryId !== 'string') {
        return res.status(400).json({
          success: false,
          message: `Anggaran pada indeks ${i} tidak memiliki categoryId valid.`
        });
      }
    }

    // 5. Eksekusi Impor di Dalam Database Transaction Atomik
    const result = await prisma.$transaction(async (tx) => {
      // Jika mode replace, hapus data lama pengguna aktif saja
      if (mode === 'replace') {
        await tx.transaction.deleteMany({ where: { userId } });
        await tx.budget.deleteMany({ where: { userId } });
        await tx.wallet.deleteMany({ where: { userId } });
        await tx.category.deleteMany({ where: { userId } });
      }

      // A. Ambil kategori pengguna yang sudah ada di DB
      const existingCategories = await tx.category.findMany({
        where: {
          OR: [
            { isSystem: true },
            { userId }
          ]
        }
      });
      const categoryMap = new Map();
      existingCategories.forEach((cat) => {
        categoryMap.set(cat.id, cat);
        categoryMap.set(`${cat.name.toLowerCase()}_${cat.type}`, cat);
      });

      // Impor / pulihkan kategori kustom baru
      let importedCategoriesCount = 0;
      for (const cat of rawCategories) {
        const key = `${cat.name.trim().toLowerCase()}_${cat.type}`;
        if (!categoryMap.has(key)) {
          const created = await tx.category.create({
            data: {
              name: cat.name.trim(),
              type: cat.type,
              color: cat.color || '#64748b',
              icon: cat.icon || 'MoreHorizontal',
              isSystem: false,
              userId // SELALU pasang pemilik ke userId yang sedang login
            }
          });
          categoryMap.set(created.id, created);
          categoryMap.set(key, created);
          importedCategoriesCount++;
        }
      }

      // B. Ambil dompet pengguna yang sudah ada
      const existingWallets = await tx.wallet.findMany({ where: { userId } });
      const walletMap = new Map();
      existingWallets.forEach((w) => {
        walletMap.set(w.id, w);
        walletMap.set(w.name.toLowerCase(), w);
      });

      // Impor dompet baru jika belum ada
      let importedWalletsCount = 0;
      for (const w of rawWallets) {
        const key = w.name.trim().toLowerCase();
        if (!walletMap.has(key)) {
          const created = await tx.wallet.create({
            data: {
              name: w.name.trim(),
              type: w.type || 'Bank',
              initialBalance: Number(w.initialBalance ?? w.balance ?? 0),
              color: w.color || '#6366f1',
              icon: w.icon || 'Wallet',
              userId // SELALU pasang pemilik ke userId pengguna aktif
            }
          });
          walletMap.set(created.id, created);
          walletMap.set(key, created);
          importedWalletsCount++;
        }
      }

      // C. Impor Anggaran
      let importedBudgetsCount = 0;
      for (const b of rawBudgets) {
        // Cocokkan categoryId ke categoryMap
        let targetCatId = b.categoryId;
        if (!categoryMap.has(targetCatId)) {
          // Cari by name jika ada
          const found = Array.from(categoryMap.values()).find((c) => c.id === b.categoryId || c.name.toLowerCase() === b.categoryId.toLowerCase());
          if (found) {
            targetCatId = found.id;
          } else {
            // Jika kategori tidak ada sama sekali, fallback ke kategori umum 'food'
            targetCatId = 'food';
          }
        }

        const existingBudget = await tx.budget.findFirst({
          where: {
            userId,
            categoryId: targetCatId,
            period: b.period || 'monthly'
          }
        });

        if (existingBudget) {
          // Update limit anggaran
          await tx.budget.update({
            where: { id: existingBudget.id },
            data: { amount: Number(b.amount ?? b.limit) }
          });
          importedBudgetsCount++;
        } else {
          // Buat anggaran baru
          await tx.budget.create({
            data: {
              categoryId: targetCatId,
              amount: Number(b.amount ?? b.limit),
              period: b.period || 'monthly',
              userId
            }
          });
          importedBudgetsCount++;
        }
      }

      // D. Impor Transaksi
      let importedTxCount = 0;
      for (const t of rawTransactions) {
        // Tentukan kategori valid
        let targetCat = t.category || t.categoryId;
        if (targetCat) {
          if (!categoryMap.has(targetCat)) {
            const found = Array.from(categoryMap.values()).find((c) => c.id === targetCat || c.name.toLowerCase() === targetCat.toLowerCase());
            targetCat = found ? found.id : (t.type === 'income' ? 'salary' : 'food');
          }
        } else {
          targetCat = t.type === 'income' ? 'salary' : 'food';
        }

        // Tentukan dompet valid
        let targetWallet = t.wallet || t.walletId;
        if (targetWallet && !walletMap.has(targetWallet)) {
          const found = Array.from(walletMap.values()).find((w) => w.id === targetWallet || w.name.toLowerCase() === targetWallet.toLowerCase());
          targetWallet = found ? found.id : (existingWallets[0]?.id || 'cash');
        } else if (!targetWallet) {
          targetWallet = existingWallets[0]?.id || 'cash';
        }

        // Cek duplikasi transaksi di mode merge
        if (mode === 'merge') {
          const txDate = new Date(t.date);
          const isDuplicate = await tx.transaction.findFirst({
            where: {
              userId,
              title: t.title.trim(),
              amount: Number(t.amount),
              type: t.type,
              date: txDate
            }
          });
          if (isDuplicate) {
            continue; // Lewati transaksi yang identik persis
          }
        }

        await tx.transaction.create({
          data: {
            title: t.title.trim(),
            amount: Number(t.amount),
            type: t.type,
            category: targetCat,
            wallet: targetWallet,
            date: new Date(t.date),
            description: t.description ? String(t.description).trim() : null,
            userId // Kepemilikan terjamin selalu akun yang sedang login
          }
        });
        importedTxCount++;
      }

      return {
        importedWalletsCount,
        importedCategoriesCount,
        importedBudgetsCount,
        importedTxCount
      };
    });

    res.status(200).json({
      success: true,
      message: 'Pemulihan data cadangan berhasil diselesaikan secara atomik!',
      mode,
      imported: {
        wallets: result.importedWalletsCount,
        categories: result.importedCategoriesCount,
        budgets: result.importedBudgetsCount,
        transactions: result.importedTxCount
      },
      summary: {
        wallets: result.importedWalletsCount,
        categories: result.importedCategoriesCount,
        budgets: result.importedBudgetsCount,
        transactions: result.importedTxCount
      }
    });
  } catch (error) {
    next(error);
  }
};
