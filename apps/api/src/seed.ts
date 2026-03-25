import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client/index.js';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcrypt from 'bcryptjs';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      surname: 'User',
      role: 'ADMIN',
    },
  });
  
  console.log('Admin created:', admin.username);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
