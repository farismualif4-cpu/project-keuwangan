// Middleware penanganan error terpusat
export const errorHandler = (err, req, res, next) => {
  // Catat error ke console server untuk debugging
  console.error('[SERVER ERROR]:', err);

  let statusCode = err.statusCode || 500;
  if (err.message && err.message.includes('CORS blocked')) {
    statusCode = 403;
  }
  const message = err.message || 'Terjadi kesalahan internal pada server';

  res.status(statusCode).json({
    success: false,
    message,
    // Jangan bocorkan stack trace di environment produksi
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Middleware rute 404 Not Found
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}`
  });
};
