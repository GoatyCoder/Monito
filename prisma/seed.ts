import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PrismaClient } from '../apps/api/src/generated/prisma/client.js';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL || 'file:prisma/dev.db';
console.log('Database URL:', databaseUrl);

const dbPath = databaseUrl.startsWith('file:') 
  ? join(__dirname, '..', databaseUrl.replace('file:', ''))
  : databaseUrl;
console.log('Resolved DB path:', dbPath);

const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const SALT_ROUNDS = 12;

  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('admin123456', SALT_ROUNDS);
  const userPassword = await bcrypt.hash('user123456', SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email: 'admin@monito.local' },
    update: {},
    create: {
      email: 'admin@monito.local',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('Created admin user: admin@monito.local / admin123456');

  await prisma.user.upsert({
    where: { email: 'user@monito.local' },
    update: {},
    create: {
      email: 'user@monito.local',
      password: userPassword,
      name: 'Standard User',
      role: 'USER',
    },
  });
  console.log('Created user: user@monito.local / user123456');

  const uvaProduct = await prisma.product.upsert({
    where: { code: 'UVA' },
    update: {},
    create: {
      code: 'UVA',
      name: 'Uva da tavola',
      description: 'Uva da tavola fresca di alta qualità',
    },
  });

  const aranceProduct = await prisma.product.upsert({
    where: { code: 'ARC' },
    update: {},
    create: {
      code: 'ARC',
      name: 'Arance',
      description: 'Arance fresche',
    },
  });

  console.log('Created products: UVA, ARC');

  await prisma.variety.upsert({
    where: { code: 'CRIMSON' },
    update: {},
    create: {
      code: 'CRIMSON',
      name: 'Crimson Seedless',
      description: 'Varietà di uva rossa senza semi',
      productId: uvaProduct.id,
    },
  });

  await prisma.variety.upsert({
    where: { code: 'ITALIA' },
    update: {},
    create: {
      code: 'ITALIA',
      name: 'Italia',
      description: 'Uva bianca italiana',
      productId: uvaProduct.id,
    },
  });

  await prisma.variety.upsert({
    where: { code: 'REGAL' },
    update: {},
    create: {
      code: 'REGAL',
      name: 'Regal Seedless',
      description: 'Uva nera senza semi',
      productId: uvaProduct.id,
    },
  });

  await prisma.variety.upsert({
    where: { code: 'LANE_LATE' },
    update: {},
    create: {
      code: 'LANE_LATE',
      name: 'Lane Late',
      description: 'Arancia tardiva',
      productId: aranceProduct.id,
    },
  });

  await prisma.variety.upsert({
    where: { code: 'VALENCIA' },
    update: {},
    create: {
      code: 'VALENCIA',
      name: 'Valencia',
      description: 'Arancia dolce',
      productId: aranceProduct.id,
    },
  });

  console.log('Created varieties: CRIMSON, ITALIA, REGAL, LANE_LATE, VALENCIA');

  const crimsonVariety = await prisma.variety.findUnique({ where: { code: 'CRIMSON' } });
  
  if (crimsonVariety) {
    await prisma.fieldLot.upsert({
      where: { lotCode: 'LOT-2024-001' },
      update: {},
      create: {
        lotCode: 'LOT-2024-001',
        supplier: 'Paolo Rossi',
        varietyId: crimsonVariety.id,
      },
    });
    console.log('Created field lot: LOT-2024-001');
  }

  await prisma.packaging.upsert({
    where: { code: 'IFCO-6410' },
    update: {},
    create: {
      code: 'IFCO-6410',
      name: 'IFCO 6410',
      description: 'Imballaggio in plastica riutilizzabile',
    },
  });

  await prisma.packaging.upsert({
    where: { code: 'CPR-6412M' },
    update: {},
    create: {
      code: 'CPR-6412M',
      name: 'CPR 6412M',
      description: 'Cartone 40x60',
    },
  });

  console.log('Created packagings: IFCO-6410, CPR-6412M');

  await prisma.processedProduct.upsert({
    where: { code: 'CEST-10X500' },
    update: {},
    create: {
      code: 'CEST-10X500',
      name: 'Cestino 10x500g',
      description: 'Cestino con 10 vaschette da 500g',
      weightPerBoxKg: 5.0,
    },
  });

  await prisma.processedProduct.upsert({
    where: { code: 'SAC-ARC-6X2KG' },
    update: {},
    create: {
      code: 'SAC-ARC-6X2KG',
      name: 'Sacchetto Arance 6x2kg',
      description: 'Sacchetto con 6 retine da 2kg',
      weightPerBoxKg: 12.0,
    },
  });

  console.log('Created processed products: CEST-10X500, SAC-ARC-6X2KG');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
