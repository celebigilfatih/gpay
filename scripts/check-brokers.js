import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBrokers() {
  try {
    const brokers = await prisma.broker.findMany();
    console.log('Aracı kurumlar:', brokers);
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBrokers();