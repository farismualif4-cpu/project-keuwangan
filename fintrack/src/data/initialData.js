export const CATEGORIES = {
  expense: [
    { id: 'food', name: 'Makanan & Minuman', icon: 'Utensils', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
    { id: 'transport', name: 'Transportasi', icon: 'Car', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
    { id: 'shopping', name: 'Belanja & Kebutuhan', icon: 'ShoppingBag', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' },
    { id: 'bills', name: 'Tagihan & Utilitas', icon: 'Zap', color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)' },
    { id: 'entertainment', name: 'Hiburan & Hobi', icon: 'Film', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
    { id: 'health', name: 'Kesehatan', icon: 'HeartPulse', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
    { id: 'education', name: 'Edukasi & Kursus', icon: 'GraduationCap', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
    { id: 'others_exp', name: 'Lainnya', icon: 'MoreHorizontal', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
  ],
  income: [
    { id: 'salary', name: 'Gaji Pokok', icon: 'Briefcase', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
    { id: 'freelance', name: 'Proyek Freelance', icon: 'Laptop', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
    { id: 'investment', name: 'Investasi & Dividen', icon: 'TrendingUp', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
    { id: 'bonus', name: 'Bonus & THR', icon: 'Gift', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
    { id: 'others_inc', name: 'Pemasukan Lain', icon: 'PlusCircle', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.12)' },
  ]
};

export const WALLETS = [
  { id: 'bca', name: 'Bank BCA', type: 'Bank', icon: 'Building2', balance: 7450000, color: '#0060af' },
  { id: 'mandiri', name: 'Bank Mandiri', type: 'Bank', icon: 'Landmark', balance: 4200000, color: '#002554' },
  { id: 'cash', name: 'Dompet Tunai', type: 'Cash', icon: 'Banknote', balance: 850000, color: '#10b981' },
  { id: 'gopay', name: 'GoPay / e-Wallet', type: 'e-Wallet', icon: 'Smartphone', balance: 650000, color: '#00aed6' },
];

export const INITIAL_BUDGETS = [
  { categoryId: 'food', limit: 2500000 },
  { categoryId: 'shopping', limit: 1500000 },
  { categoryId: 'transport', limit: 900000 },
  { categoryId: 'bills', limit: 1200000 },
  { categoryId: 'entertainment', limit: 600000 },
];

export const INITIAL_TRANSACTIONS = [
  {
    id: 'tx-1',
    title: 'Gaji Bulanan PT Digital Solusi',
    amount: 12500000,
    type: 'income',
    categoryId: 'salary',
    walletId: 'bca',
    date: '2026-10-01',
    notes: 'Transfer payroll bulanan'
  },
  {
    id: 'tx-2',
    title: 'Belanja Bulanan Supermarket',
    amount: 850000,
    type: 'expense',
    categoryId: 'food',
    walletId: 'bca',
    date: '2026-10-02',
    notes: 'Kebutuhan pokok beras, minyak, sayuran'
  },
  {
    id: 'tx-3',
    title: 'Tagihan Listrik PLN & Internet WiFi',
    amount: 680000,
    type: 'expense',
    categoryId: 'bills',
    walletId: 'mandiri',
    date: '2026-10-03',
    notes: 'PLN 2200VA + IndiHome 50Mbps'
  },
  {
    id: 'tx-4',
    title: 'Proyek Desain Web UI/UX',
    amount: 3200000,
    type: 'income',
    categoryId: 'freelance',
    walletId: 'mandiri',
    date: '2026-10-04',
    notes: 'Pelunasan termin ke-2 klien Bandung'
  },
  {
    id: 'tx-5',
    title: 'Isi Bensin Pertamax & Tol',
    amount: 350000,
    type: 'expense',
    categoryId: 'transport',
    walletId: 'cash',
    date: '2026-10-05',
    notes: 'Perjalanan dinas harian'
  },
  {
    id: 'tx-6',
    title: 'Langganan Netflix & Spotify Family',
    amount: 235000,
    type: 'expense',
    categoryId: 'entertainment',
    walletId: 'gopay',
    date: '2026-10-06',
    notes: 'Autodebit bulanan'
  },
  {
    id: 'tx-7',
    title: 'Makan Malam Resto Keluarga',
    amount: 420000,
    type: 'expense',
    categoryId: 'food',
    walletId: 'gopay',
    date: '2026-10-07',
    notes: 'Weekend dinner'
  },
  {
    id: 'tx-8',
    title: 'Dividen Reksadana & Saham',
    amount: 750000,
    type: 'income',
    categoryId: 'investment',
    walletId: 'bca',
    date: '2026-10-08',
    notes: 'Dividen kuartal 3'
  },
  {
    id: 'tx-9',
    title: 'Beli Buku Pemrograman & Kursus React',
    amount: 299000,
    type: 'expense',
    categoryId: 'education',
    walletId: 'mandiri',
    date: '2026-10-09',
    notes: 'E-book & kelas video frontend'
  },
  {
    id: 'tx-10',
    title: 'Beli Pakaian Kerja & Sepatu',
    amount: 620000,
    type: 'expense',
    categoryId: 'shopping',
    walletId: 'bca',
    date: '2026-10-10',
    notes: 'Kemeja formal dan kaos kaki'
  }
];

export const formatRupiah = (val) => {
  const number = Number(val) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
};

export const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
