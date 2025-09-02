import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTestClient() {
  try {
    // Test client'ı güncelle
    const updatedClient = await prisma.client.update({
      where: { id: '3d2ca00f-090f-4211-8a5c-68305720bd7f' },
      data: {
        userId: 'c71a90ca-93ac-4add-b9d7-880f38ac0a97'
      }
    });
    
    console.log('Test client güncellendi:', updatedClient);
    
    // Client'a ait aracı kurumları kontrol et
    const clientBrokers = await prisma.clientBroker.findMany({
      where: { clientId: '3d2ca00f-090f-4211-8a5c-68305720bd7f' },
      include: { broker: true }
    });
    
    console.log('Client aracı kurumları:', clientBrokers.map(cb => cb.broker.name));
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTestClient();