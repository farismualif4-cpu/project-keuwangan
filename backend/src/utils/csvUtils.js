/**
 * Utilitas CSV FinTrack
 * Menangani pembuatan format CSV aman, escaping karakter khusus, dan mitigasi Formula Injection
 */

/**
 * Karakter yang dapat memicu eksekusi formula pada Microsoft Excel / LibreOffice / Google Sheets
 */
const FORMULA_INJECTION_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

/**
 * Membersihkan dan melakukan escaping nilai kolom CSV
 * @param {any} value Nilai yang akan dimasukkan ke sel CSV
 * @returns {string} String CSV yang aman
 */
export function escapeCsvCell(value) {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // Mitigasi CSV Formula Injection (CWE-1236):
  // Jika nilai diawali dengan karakter formula berbahaya, beri prefix tanda petik tunggal (')
  if (str.length > 0 && FORMULA_INJECTION_PREFIXES.includes(str[0])) {
    str = `'${str}`;
  }

  // Jika nilai memuat tanda petik ganda, koma, titik koma, atau baris baru, bungkus dengan tanda petik ganda
  if (str.includes('"') || str.includes(',') || str.includes(';') || str.includes('\n') || str.includes('\r')) {
    // Escape tanda petik ganda dengan menduakannya ("" -> ")
    return `"${str.replace(/"/g, '""')}"`;
  }

  return `"${str}"`;
}

/**
 * Menghasilkan konten CSV transaksi dari daftar transaksi pengguna
 * @param {Array} transactions Daftar transaksi dari database
 * @returns {string} Konten teks CSV lengkap dengan UTF-8 BOM
 */
export function generateTransactionsCsv(transactions = []) {
  // UTF-8 BOM (\uFEFF) untuk memastikan aplikasi spreadsheet membaca karakter Indonesia & Unicode dengan benar
  const UTF8_BOM = '\uFEFF';

  const headers = [
    'ID',
    'Tanggal',
    'Judul',
    'Tipe',
    'Kategori',
    'Dompet',
    'Nominal',
    'Catatan'
  ];

  const headerRow = headers.map(escapeCsvCell).join(',');

  const rows = transactions.map((t) => {
    const formattedDate = t.date instanceof Date 
      ? t.date.toISOString().split('T')[0] 
      : String(t.date || '').split('T')[0];

    const typeLabel = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';

    return [
      escapeCsvCell(t.id),
      escapeCsvCell(formattedDate),
      escapeCsvCell(t.title),
      escapeCsvCell(typeLabel),
      escapeCsvCell(t.category),
      escapeCsvCell(t.wallet),
      escapeCsvCell(t.amount),
      escapeCsvCell(t.description || '')
    ].join(',');
  });

  return UTF8_BOM + [headerRow, ...rows].join('\r\n');
}
