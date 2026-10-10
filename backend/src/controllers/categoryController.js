import prisma from '../config/prisma.js';

/**
 * Controller Manajemen Kategori Transaksi (Categories)
 * Mengelola kategori bawaan sistem dan kategori kustom dinamis per pengguna
 */

/**
 * 1. GET /api/categories - Mengambil seluruh kategori (Sistem + Kustom Pengguna)
 */
export const getCategories = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    const where = {
      OR: [
        { isSystem: true },
        { userId }
      ]
    };

    if (type && ['income', 'expense'].includes(type)) {
      where.type = type;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [
        { isSystem: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar kategori berhasil diambil.',
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/categories/:id - Mengambil detail satu kategori
 */
export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const category = await prisma.category.findFirst({
      where: {
        id,
        OR: [
          { isSystem: true },
          { userId }
        ]
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori tidak ditemukan atau Anda tidak memiliki akses.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Detail kategori berhasil diambil.',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /api/categories - Membuat kategori kustom baru
 */
export const createCategory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, type, color = '#6366f1', icon = 'Tag' } = req.body;

    // --- Validasi Input Wajib ---
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Nama kategori wajib diisi (minimal 2 karakter).'
      });
    }

    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipe kategori wajib bernilai "income" atau "expense".'
      });
    }

    const cleanName = name.trim();

    // --- Cek Duplikasi Nama Kategori ---
    const existingDuplicate = await prisma.category.findFirst({
      where: {
        type,
        name: { equals: cleanName },
        OR: [
          { isSystem: true },
          { userId }
        ]
      }
    });

    if (existingDuplicate) {
      return res.status(400).json({
        success: false,
        message: `Kategori "${cleanName}" untuk jenis "${type}" sudah ada.`
      });
    }

    const newCategory = await prisma.category.create({
      data: {
        name: cleanName,
        type,
        color: color.trim(),
        icon: icon.trim(),
        isSystem: false,
        userId
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Kategori baru berhasil ditambahkan.',
      data: newCategory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. PUT /api/categories/:id - Memperbarui kategori kustom
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, type, color, icon } = req.body;

    // Cari kategori yang akan diubah
    const category = await prisma.category.findFirst({
      where: {
        id,
        OR: [
          { isSystem: true },
          { userId }
        ]
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori tidak ditemukan atau Anda tidak memiliki akses.'
      });
    }

    // Proteksi: Kategori sistem dilarang diubah!
    if (category.isSystem) {
      return res.status(403).json({
        success: false,
        message: 'Kategori sistem tidak dapat diubah.'
      });
    }

    const updatePayload = {};

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Nama kategori minimal 2 karakter.'
        });
      }
      const cleanName = name.trim();
      const targetType = type || category.type;

      // Cek duplikasi dengan kategori lain milik user atau sistem
      const duplicate = await prisma.category.findFirst({
        where: {
          id: { not: id },
          name: { equals: cleanName },
          type: targetType,
          OR: [
            { isSystem: true },
            { userId }
          ]
        }
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Kategori "${cleanName}" untuk jenis "${targetType}" sudah digunakan.`
        });
      }

      updatePayload.name = cleanName;
    }

    if (type !== undefined) {
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipe kategori harus bernilai "income" atau "expense".'
        });
      }
      updatePayload.type = type;
    }

    if (color !== undefined) {
      updatePayload.color = String(color).trim();
    }

    if (icon !== undefined) {
      updatePayload.icon = String(icon).trim();
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updatePayload
    });

    return res.status(200).json({
      success: true,
      message: 'Kategori berhasil diperbarui.',
      data: updatedCategory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. DELETE /api/categories/:id - Menghapus kategori kustom
 * Aturan proteksi:
 * 1. Kategori sistem tidak boleh dihapus.
 * 2. Kategori yang masih digunakan transaksi atau anggaran tidak boleh dihapus.
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const category = await prisma.category.findFirst({
      where: {
        id,
        OR: [
          { isSystem: true },
          { userId }
        ]
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori tidak ditemukan atau Anda tidak memiliki akses.'
      });
    }

    // Proteksi: Kategori sistem dilarang dihapus
    if (category.isSystem) {
      return res.status(403).json({
        success: false,
        message: 'Kategori sistem tidak dapat dihapus.'
      });
    }

    // Proteksi Integritas: Cek apakah masih digunakan oleh transaksi
    const txCount = await prisma.transaction.count({
      where: {
        userId,
        OR: [
          { category: id },
          { category: category.name }
        ]
      }
    });

    // Proteksi Integritas: Cek apakah masih digunakan oleh anggaran
    const budgetCount = await prisma.budget.count({
      where: {
        userId,
        categoryId: id
      }
    });

    if (txCount > 0 || budgetCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Kategori "${category.name}" tidak dapat dihapus karena masih digunakan oleh ${txCount} catatan transaksi dan ${budgetCount} anggaran.`
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: `Kategori "${category.name}" berhasil dihapus.`
    });
  } catch (error) {
    next(error);
  }
};
