import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBrokerCount() {
  try {
    const count = await prisma.broker.count();
    console.log('Toplam broker sayısı:', count);
    
    const brokers = await prisma.broker.findMany({
      select: {
        name: true,
        code: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log('\nMevcut brokerlar:');
    brokers.forEach((broker, index) => {
      console.log(`${index + 1}. ${broker.name} (${broker.code})`);
    });
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBrokerCount();
