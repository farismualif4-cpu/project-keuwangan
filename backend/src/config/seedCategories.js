import prisma from './prisma.js';

export const SYSTEM_CATEGORIES = [
  // Expense Categories
  { id: 'food', name: 'Makanan & Minuman', type: 'expense', icon: 'Utensils', color: '#f97316', isSystem: true },
  { id: 'transport', name: 'Transportasi', type: 'expense', icon: 'Car', color: '#06b6d4', isSystem: true },
  { id: 'shopping', name: 'Belanja & Kebutuhan', type: 'expense', icon: 'ShoppingBag', color: '#ec4899', isSystem: true },
  { id: 'bills', name: 'Tagihan & Utilitas', type: 'expense', icon: 'Zap', color: '#eab308', isSystem: true },
  { id: 'entertainment', name: 'Hiburan & Hobi', type: 'expense', icon: 'Film', color: '#8b5cf6', isSystem: true },
  { id: 'health', name: 'Kesehatan', type: 'expense', icon: 'HeartPulse', color: '#ef4444', isSystem: true },
  { id: 'education', name: 'Edukasi & Kursus', type: 'expense', icon: 'GraduationCap', color: '#3b82f6', isSystem: true },
  { id: 'others_exp', name: 'Lainnya', type: 'expense', icon: 'MoreHorizontal', color: '#64748b', isSystem: true },

  // Income Categories
  { id: 'salary', name: 'Gaji Pokok', type: 'income', icon: 'Briefcase', color: '#10b981', isSystem: true },
  { id: 'freelance', name: 'Proyek Freelance', type: 'income', icon: 'Laptop', color: '#3b82f6', isSystem: true },
  { id: 'investment', name: 'Investasi & Dividen', type: 'income', icon: 'TrendingUp', color: '#8b5cf6', isSystem: true },
  { id: 'bonus', name: 'Bonus & THR', type: 'income', icon: 'Gift', color: '#f59e0b', isSystem: true },
  { id: 'others_inc', name: 'Pemasukan Lain', type: 'income', icon: 'PlusCircle', color: '#14b8a6', isSystem: true },
];

/**
 * Memastikan kategori sistem bawaan tersedia di database
 */
export async function seedSystemCategories() {
  try {
    for (const cat of SYSTEM_CATEGORIES) {
      const exists = await prisma.category.findUnique({
        where: { id: cat.id }
      });

      if (!exists) {
        await prisma.category.create({
          data: {
            id: cat.id,
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            color: cat.color,
            isSystem: true,
            userId: null
          }
        });
      }
    }
  } catch (error) {
    console.warn('[SEED WARNING] Gagal memeriksa/membuat kategori sistem:', error.message);
  }
}
