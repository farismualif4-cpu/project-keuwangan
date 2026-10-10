import prisma from '../config/prisma.js';

/**
 * Helper untuk format response transaksi agar konsisten dan ramah frontend
 */
const formatTransaction = (tx) => {
  if (!tx) return null;
  return {
    id: tx.id,
    title: tx.title,
    amount: tx.amount,
    type: tx.type,
    category: tx.category,
    categoryId: tx.category,     // Kompatibilitas frontend
    wallet: tx.wallet,
    walletId: tx.wallet,         // Kompatibilitas frontend
    date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : '',
    rawDate: tx.date,
    description: tx.description || '',
    notes: tx.description || '', // Kompatibilitas frontend
    userId: tx.userId,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt
  };
};

/**
 * 1. GET /api/transactions - Mengambil daftar transaksi dengan Filter dan Paginasi
 */
export const getAllTransactions = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      type,
      category,
      categoryId,
      wallet,
      walletId,
      startDate,
      endDate,
      search,
      sortBy
    } = req.query;

    const userId = req.user.id; // Kunci keamanan: hanya data milik user yang login

    const where = {
      userId
    };

    // Filter Type
    if (type && type !== 'all') {
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Parameter "type" tidak valid. Gunakan "income" atau "expense".'
        });
      }
      where.type = type;
    }

    // Filter Category
    const selectedCat = category || categoryId;
    if (selectedCat && selectedCat !== 'all') {
      where.category = selectedCat;
    }

    // Filter Wallet
    const selectedWallet = wallet || walletId;
    if (selectedWallet && selectedWallet !== 'all') {
      where.wallet = selectedWallet;
    }

    // Filter Tanggal (startDate & endDate)
    if (startDate || endDate) {
      const dateFilter = {};

      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Format "startDate" tidak valid. Gunakan format YYYY-MM-DD.'
          });
        }
        start.setHours(0, 0, 0, 0);
        dateFilter.gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Format "endDate" tidak valid. Gunakan format YYYY-MM-DD.'
          });
        }
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
          return res.status(400).json({
            success: false,
            message: 'Parameter "startDate" tidak boleh lebih besar dari "endDate".'
          });
        }
      }

      where.date = dateFilter;
    }

    // Filter Pencarian (search)
    if (search && search.trim() !== '') {
      const cleanSearch = search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: cleanSearch } },
            { description: { contains: cleanSearch } }
          ]
        }
      ];
    }

    // Pengurutan (Sorting)
    let orderBy = { date: 'desc' };
    if (sortBy === 'date-asc') {
      orderBy = { date: 'asc' };
    } else if (sortBy === 'amount-desc') {
      orderBy = { amount: 'desc' };
    } else if (sortBy === 'amount-asc') {
      orderBy = { amount: 'asc' };
    }

    // Paginasi
    const isPaginated = page !== undefined || limit !== undefined;
    let pageNum = 1;
    let limitNum = 10;

    if (isPaginated) {
      if (page !== undefined) {
        const parsedPage = parseInt(page, 10);
        if (isNaN(parsedPage) || parsedPage < 1) {
          return res.status(400).json({
            success: false,
            message: 'Parameter "page" harus berupa angka bulat positif (minimal 1).'
          });
        }
        pageNum = parsedPage;
      }

      if (limit !== undefined) {
        const parsedLimit = parseInt(limit, 10);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
          return res.status(400).json({
            success: false,
            message: 'Parameter "limit" harus berupa angka bulat positif (minimal 1).'
          });
        }
        limitNum = parsedLimit > 100 ? 100 : parsedLimit;
      }
    }

    // Hitung total data yang cocok dengan filter di database
    const total = await prisma.transaction.count({ where });
    const totalPages = isPaginated ? (Math.ceil(total / limitNum) || 1) : 1;
    const skip = isPaginated ? (pageNum - 1) * limitNum : undefined;
    const take = isPaginated ? limitNum : undefined;

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy,
      skip,
      take
    });

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil daftar transaksi pengguna',
      count: transactions.length,
      pagination: {
        page: pageNum,
        limit: isPaginated ? limitNum : total,
        total,
        totalPages
      },
      data: transactions.map(formatTransaction)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/transactions/:id - Mengambil satu detail transaksi milik pengguna
 */
export const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: `Transaksi dengan ID '${id}' tidak ditemukan atau Anda tidak memiliki akses.`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil detail transaksi',
      data: formatTransaction(transaction)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /api/transactions - Membuat transaksi baru untuk pengguna yang login
 */
export const createTransaction = async (req, res, next) => {
  try {
    const { title, amount, type, category, categoryId, wallet, walletId, date, description, notes } = req.body;
    const userId = req.user.id;

    const finalCategory = category || categoryId;
    const finalWallet = wallet || walletId || 'cash';
    const finalDesc = description !== undefined ? description : notes;

    // --- Validasi Input Wajib ---
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Field "title" (judul transaksi) wajib diisi'
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Field "amount" (nominal) harus berupa angka lebih besar dari 0'
      });
    }

    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Field "type" wajib bernilai "income" atau "expense"'
      });
    }

    if (!finalCategory || typeof finalCategory !== 'string' || finalCategory.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Field "category" / "categoryId" wajib diisi'
      });
    }

    // --- Validasi Kategori: Cegah ID kategori tidak valid ---
    const cleanCat = finalCategory.trim();
    const validCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { id: cleanCat },
          { name: cleanCat }
        ],
        AND: [
          {
            OR: [
              { isSystem: true },
              { userId }
            ]
          }
        ]
      }
    });

    if (!validCategory) {
      return res.status(400).json({
        success: false,
        message: `Kategori "${cleanCat}" tidak valid atau tidak ditemukan di sistem/akun Anda.`
      });
    }

    let transactionDate = new Date();
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Format "date" tidak valid'
        });
      }
      transactionDate = parsedDate;
    }

    const newTransaction = await prisma.transaction.create({
      data: {
        title: title.trim(),
        amount: Math.round(parsedAmount),
        type,
        category: validCategory.id, // Simpan ID kategori yang valid
        wallet: finalWallet.trim(),
        date: transactionDate,
        description: finalDesc ? finalDesc.trim() : null,
        userId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil dicatat',
      data: formatTransaction(newTransaction)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. PUT /api/transactions/:id - Memperbarui transaksi milik pengguna
 */
export const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, amount, type, category, categoryId, wallet, walletId, date, description, notes } = req.body;

    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: `Transaksi dengan ID '${id}' tidak ditemukan atau Anda tidak memiliki akses.`
      });
    }

    const updateData = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Field "title" tidak boleh kosong'
        });
      }
      updateData.title = title.trim();
    }

    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Field "amount" harus berupa angka lebih besar dari 0'
        });
      }
      updateData.amount = Math.round(parsedAmount);
    }

    if (type !== undefined) {
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Field "type" harus bernilai "income" atau "expense"'
        });
      }
      updateData.type = type;
    }

    const finalCategory = category || categoryId;
    if (finalCategory !== undefined) {
      if (typeof finalCategory !== 'string' || finalCategory.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Field "category" tidak boleh kosong'
        });
      }
      const cleanCat = finalCategory.trim();
      const validCategory = await prisma.category.findFirst({
        where: {
          OR: [
            { id: cleanCat },
            { name: cleanCat }
          ],
          AND: [
            {
              OR: [
                { isSystem: true },
                { userId }
              ]
            }
          ]
        }
      });
      if (!validCategory) {
        return res.status(400).json({
          success: false,
          message: `Kategori "${cleanCat}" tidak valid atau tidak ditemukan.`
        });
      }
      updateData.category = validCategory.id;
    }

    const finalWallet = wallet || walletId;
    if (finalWallet !== undefined) {
      updateData.wallet = String(finalWallet).trim();
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Format "date" tidak valid'
        });
      }
      updateData.date = parsedDate;
    }

    const finalDesc = description !== undefined ? description : notes;
    if (finalDesc !== undefined) {
      updateData.description = typeof finalDesc === 'string' && finalDesc.trim() !== '' ? finalDesc.trim() : null;
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Transaksi berhasil diperbarui',
      data: formatTransaction(updatedTransaction)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. DELETE /api/transactions/:id - Menghapus transaksi milik pengguna
 */
export const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: `Transaksi dengan ID '${id}' tidak ditemukan atau Anda tidak memiliki akses.`
      });
    }

    await prisma.transaction.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Transaksi berhasil dihapus',
      data: {
        id: existingTransaction.id,
        title: existingTransaction.title
      }
    });
  } catch (error) {
    next(error);
  }
};
