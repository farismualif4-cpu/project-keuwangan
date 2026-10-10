import prisma from '../src/config/prisma.js';

const INITIAL_TRANSACTIONS = [
  {
    title: 'Gaji Bulanan PT Digital Solusi',
    amount: 12500000,
    type: 'income',
    category: 'salary',
    wallet: 'bca',
    date: new Date('2026-10-01'),
    description: 'Transfer payroll bulanan'
  },
  {
    title: 'Belanja Bulanan Supermarket',
    amount: 850000,
    type: 'expense',
    category: 'food',
    wallet: 'bca',
    date: new Date('2026-10-02'),
    description: 'Kebutuhan pokok beras, minyak, sayuran'
  },
  {
    title: 'Tagihan Listrik PLN & Internet WiFi',
    amount: 680000,
    type: 'expense',
    category: 'bills',
    wallet: 'mandiri',
    date: new Date('2026-10-03'),
    description: 'PLN 2200VA + IndiHome 50Mbps'
  },
  {
    title: 'Proyek Desain Web UI/UX',
    amount: 3200000,
    type: 'income',
    category: 'freelance',
    wallet: 'mandiri',
    date: new Date('2026-10-04'),
    description: 'Pelunasan termin ke-2 klien Bandung'
  },
  {
    title: 'Isi Bensin Pertamax & Tol',
    amount: 350000,
    type: 'expense',
    category: 'transport',
    wallet: 'cash',
    date: new Date('2026-10-05'),
    description: 'Perjalanan dinas harian'
  },
  {
    title: 'Langganan Netflix & Spotify Family',
    amount: 235000,
    type: 'expense',
    category: 'entertainment',
    wallet: 'gopay',
    date: new Date('2026-10-06'),
    description: 'Autodebit bulanan'
  },
  {
    title: 'Makan Malam Resto Keluarga',
    amount: 420000,
    type: 'expense',
    category: 'food',
    wallet: 'gopay',
    date: new Date('2026-10-07'),
    description: 'Weekend dinner'
  },
  {
    title: 'Dividen Reksadana & Saham',
    amount: 750000,
    type: 'income',
    category: 'investment',
    wallet: 'bca',
    date: new Date('2026-10-08'),
    description: 'Dividen kuartal 3'
  },
  {
    title: 'Beli Buku Pemrograman & Kursus React',
    amount: 299000,
    type: 'expense',
    category: 'education',
    wallet: 'mandiri',
    date: new Date('2026-10-09'),
    description: 'E-book & kelas video frontend'
  },
  {
    title: 'Beli Pakaian Kerja & Sepatu',
    amount: 620000,
    type: 'expense',
    category: 'shopping',
    wallet: 'bca',
    date: new Date('2026-10-10'),
    description: 'Kemeja formal dan pakaian'
  }
];

async function seed() {
  console.log('🌱 Seeding database FinTrack...');
  // Bersihkan data transaksi uji coba
  await prisma.transaction.deleteMany();

  for (const tx of INITIAL_TRANSACTIONS) {
    await prisma.transaction.create({ data: tx });
  }

  const count = await prisma.transaction.count();
  console.log(`✅ Berhasil melakukan seed: ${count} transaksi tersimpan di SQLite!`);
}

seed()
  .catch((e) => {
    console.error('Gagal seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
