import { PrismaClient } from '@prisma/client';

// Singleton instance PrismaClient untuk koneksi database
const prisma = new PrismaClient();

export default prisma;
