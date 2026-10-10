import prisma from '../config/prisma.js';

/**
 * Controller Manajemen Dompet & Rekening Keuangan (Wallets)
 * Mengisolasi seluruh operasi berdasarkan identitas req.user.id
 */

/**
 * 1. GET /api/wallets - Mengambil seluruh dompet milik pengguna yang sedang login
 */
export const getWallets = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Ambil daftar dompet milik user
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    // Ambil transaksi user untuk mengkalkulasi saldo aktual (currentBalance) secara real-time
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      select: { amount: true, type: true, wallet: true }
    });

    const walletsWithBalance = wallets.map((w) => {
      let income = 0;
      let expense = 0;

      transactions.forEach((tx) => {
        // Cocokkan ID dompet atau slug nama
        if (tx.wallet === w.id || tx.wallet === w.name.toLowerCase()) {
          if (tx.type === 'income') {
            income += Number(tx.amount);
          } else {
            expense += Number(tx.amount);
          }
        }
      });

      const currentBalance = Math.max(0, Number(w.initialBalance) + income - expense);

      return {
        ...w,
        currentBalance,
        balance: currentBalance // Alias kompatibilitas UI frontend
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar dompet berhasil diambil.',
      data: walletsWithBalance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/wallets/:id - Mengambil satu dompet berdasarkan ID
 */
export const getWalletById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const wallet = await prisma.wallet.findFirst({
      where: { id, userId }
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Dompet tidak ditemukan atau bukan milik Anda.'
      });
    }

    // Hitung saldo aktual untuk dompet ini
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        OR: [{ wallet: id }, { wallet: wallet.name.toLowerCase() }]
      },
      select: { amount: true, type: true }
    });

    let income = 0;
    let expense = 0;
    transactions.forEach((tx) => {
      if (tx.type === 'income') income += Number(tx.amount);
      else expense += Number(tx.amount);
    });

    const currentBalance = Math.max(0, Number(wallet.initialBalance) + income - expense);

    return res.status(200).json({
      success: true,
      message: 'Detail dompet berhasil diambil.',
      data: {
        ...wallet,
        currentBalance,
        balance: currentBalance
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /api/wallets - Membuat dompet baru
 */
export const createWallet = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, type = 'Bank', initialBalance = 0, color = '#6366f1', icon = 'Wallet' } = req.body;

    // Validasi nama
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Nama dompet wajib diisi (minimal 2 karakter).'
      });
    }

    // Validasi saldo awal
    const numInitial = parseFloat(initialBalance);
    if (isNaN(numInitial) || numInitial < 0) {
      return res.status(400).json({
        success: false,
        message: 'Saldo awal harus berupa angka non-negatif.'
      });
    }

    const newWallet = await prisma.wallet.create({
      data: {
        name: name.trim(),
        type: type.trim(),
        initialBalance: numInitial,
        color: color.trim(),
        icon: icon.trim(),
        userId
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Dompet baru berhasil ditambahkan.',
      data: {
        ...newWallet,
        currentBalance: newWallet.initialBalance,
        balance: newWallet.initialBalance
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. PUT /api/wallets/:id - Memperbarui informasi dompet
 */
export const updateWallet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, type, initialBalance, color, icon } = req.body;

    // Pastikan dompet ada dan milik pengguna
    const existingWallet = await prisma.wallet.findFirst({
      where: { id, userId }
    });

    if (!existingWallet) {
      return res.status(404).json({
        success: false,
        message: 'Dompet tidak ditemukan atau Anda tidak memiliki akses.'
      });
    }

    const updatePayload = {};

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Nama dompet minimal 2 karakter.'
        });
      }
      updatePayload.name = name.trim();
    }

    if (type !== undefined) {
      updatePayload.type = String(type).trim();
    }

    if (initialBalance !== undefined) {
      const numInitial = parseFloat(initialBalance);
      if (isNaN(numInitial) || numInitial < 0) {
        return res.status(400).json({
          success: false,
          message: 'Saldo awal harus berupa angka non-negatif.'
        });
      }
      updatePayload.initialBalance = numInitial;
    }

    if (color !== undefined) {
      updatePayload.color = String(color).trim();
    }

    if (icon !== undefined) {
      updatePayload.icon = String(icon).trim();
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id },
      data: updatePayload
    });

    // Hitung ulang saldo aktual
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        OR: [{ wallet: id }, { wallet: updatedWallet.name.toLowerCase() }]
      },
      select: { amount: true, type: true }
    });

    let income = 0;
    let expense = 0;
    transactions.forEach((tx) => {
      if (tx.type === 'income') income += Number(tx.amount);
      else expense += Number(tx.amount);
    });

    const currentBalance = Math.max(0, Number(updatedWallet.initialBalance) + income - expense);

    return res.status(200).json({
      success: true,
      message: 'Dompet berhasil diperbarui.',
      data: {
        ...updatedWallet,
        currentBalance,
        balance: currentBalance
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. DELETE /api/wallets/:id - Menghapus dompet
 * Aturan proteksi: Jangan menghapus dompet yang masih memiliki transaksi terkait
 */
export const deleteWallet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Pastikan dompet ada dan milik pengguna
    const existingWallet = await prisma.wallet.findFirst({
      where: { id, userId }
    });

    if (!existingWallet) {
      return res.status(404).json({
        success: false,
        message: 'Dompet tidak ditemukan atau Anda tidak memiliki akses.'
      });
    }

    // Periksa apakah dompet masih digunakan oleh transaksi milik user
    const txCount = await prisma.transaction.count({
      where: {
        userId,
        OR: [{ wallet: id }, { wallet: existingWallet.name.toLowerCase() }]
      }
    });

    if (txCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Dompet "${existingWallet.name}" tidak dapat dihapus karena masih digunakan oleh ${txCount} catatan transaksi. Silakan hapus atau pindahkan transaksi terkait terlebih dahulu.`
      });
    }

    await prisma.wallet.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: `Dompet "${existingWallet.name}" berhasil dihapus.`
    });
  } catch (error) {
    next(error);
  }
};
