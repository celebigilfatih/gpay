import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestClient() {
  try {
    // Fatih kullanıcısını bul
    const user = await prisma.user.findFirst({
      where: {
        email: 'fatihcelebigil@gmail.com'
      }
    });

    if (!user) {
      console.log('Fatih kullanıcısı bulunamadı!');
      return;
    }

    // Test client'ı oluştur
    const testClient = await prisma.client.create({
      data: {
        fullName: 'Test Müşteri',
        phoneNumber: '555-1234567',
        brokerageFirm: 'Test Aracı Kurum',
        city: 'İstanbul',
        userId: user.id
      }
    });

    console.log('Test müşteri oluşturuldu:', testClient);

    // İlk 3 aracı kurumu bu müşteriye ata
    const brokers = await prisma.broker.findMany({
      where: { isActive: true },
      take: 3
    });

    for (const broker of brokers) {
      await prisma.clientBroker.create({
        data: {
          clientId: testClient.id,
          brokerId: broker.id
        }
      });
      console.log(`${broker.name} aracı kurumu test müşteriye atandı.`);
    }

    // Sonucu kontrol et
    const clientWithBrokers = await prisma.client.findUnique({
      where: { id: testClient.id },
      include: {
        brokers: {
          include: {
            broker: true
          }
        }
      }
    });

    console.log('\nTest müşterinin aracı kurumları:');
    clientWithBrokers.brokers.forEach((cb, index) => {
      console.log(`${index + 1}. ${cb.broker.name}`);
    });

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestClient();
