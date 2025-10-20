import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkClientBrokers() {
  const clients = await prisma.client.findMany({
    include: {
      user: { select: { name: true } },
      brokers: {
        include: {
          broker: true
        }
      }
    }
  });

  console.log('=== MÜŞTERİ VE ARACI KURUM ATAMALARI ===');
  clients.forEach(client => {
    console.log(`\nMüşteri: ${client.fullName || 'İsimsiz'} (${client.user.name})`);
    console.log(`ID: ${client.id}`);
    console.log('Atanmış Aracı Kurumlar:');
    if (client.brokers.length === 0) {
      console.log('  - Hiç aracı kurum atanmamış');
    } else {
      client.brokers.forEach(cb => {
        console.log(`  - ${cb.broker.name} (${cb.broker.code})`);
      });
    }
  });

  await prisma.$disconnect();
}

checkClientBrokers().catch(console.error);
