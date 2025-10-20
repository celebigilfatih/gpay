import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkClients() {
  try {
    // Get all clients
    const clients = await prisma.client.findMany({
      include: {
        user: true
      }
    });

    console.log('Clients:');
    clients.forEach(client => {
      console.log({
        id: client.id,
        name: client.name,
        phone: client.phone,
        brokerageFirm: client.brokerageFirm,
        city: client.city,
        user: client.user.name
      });
    });

    console.log(`\nToplam client sayısı: ${clients.length}`);
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClients();
