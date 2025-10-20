import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAllBrokers() {
  const brokers = await prisma.broker.findMany({
    orderBy: { name: 'asc' }
  });

  console.log('=== TÜM ARACI KURUMLAR ===');
  brokers.forEach(broker => {
    console.log(`${broker.name} (${broker.code}) - ${broker.isActive ? 'Aktif' : 'Pasif'}`);
  });

  await prisma.$disconnect();
}

checkAllBrokers().catch(console.error);
