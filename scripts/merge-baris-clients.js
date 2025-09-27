const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function mergeBarisClients() {
  try {
    console.log('=== Barış Manço müşteri kayıtlarını birleştiriyorum ===\n');

    // Barış Manço müşterilerini bul
    const clients = await prisma.client.findMany({
      where: {
        fullName: 'Barış Manço'
      },
      include: {
        transactions: true,
        brokers: true,
        payments: true
      }
    });

    if (clients.length !== 2) {
      console.log(`Beklenmeyen müşteri sayısı: ${clients.length}`);
      return;
    }

    console.log('Bulunan müşteriler:');
    clients.forEach((client, index) => {
      console.log(`${index + 1}. ID: ${client.id}`);
      console.log(`   Telefon: ${client.phoneNumber}`);
      console.log(`   İşlem sayısı: ${client.transactions.length}`);
      console.log(`   Broker sayısı: ${client.brokers.length}`);
      console.log(`   Ödeme sayısı: ${client.payments.length}`);
      console.log(`   Oluşturulma: ${client.createdAt}`);
      console.log('');
    });

    // Yeni kaydı (işlem olmayan) ve eski kaydı (işlem olan) belirle
    const newClient = clients.find(c => c.transactions.length === 0);
    const oldClient = clients.find(c => c.transactions.length > 0);

    if (!newClient || !oldClient) {
      console.log('Yeni ve eski kayıt belirlenemedi!');
      return;
    }

    console.log(`Yeni kayıt (hedef): ${newClient.id}`);
    console.log(`Eski kayıt (kaynak): ${oldClient.id}`);
    console.log('');

    // İşlemleri yeni kayda taşı
    console.log('İşlemleri taşıyorum...');
    const updatedTransactions = await prisma.transaction.updateMany({
      where: {
        clientId: oldClient.id
      },
      data: {
        clientId: newClient.id
      }
    });
    console.log(`${updatedTransactions.count} işlem taşındı.`);

    // Ödemeleri yeni kayda taşı
    console.log('Ödemeleri taşıyorum...');
    const updatedPayments = await prisma.payment.updateMany({
      where: {
        clientId: oldClient.id
      },
      data: {
        clientId: newClient.id
      }
    });
    console.log(`${updatedPayments.count} ödeme taşındı.`);

    // Eski kaydın brokerlarını yeni kayda ekle (duplicate olmayanları)
    console.log('Brokerları birleştiriyorum...');
    const oldBrokers = oldClient.brokers;
    const newBrokers = newClient.brokers;
    
    for (const oldBroker of oldBrokers) {
      const exists = newBrokers.some(nb => nb.brokerId === oldBroker.brokerId);
      if (!exists) {
        await prisma.clientBroker.create({
          data: {
            clientId: newClient.id,
            brokerId: oldBroker.brokerId
          }
        });
        console.log(`Broker ${oldBroker.brokerId} eklendi.`);
      }
    }

    // Eski kaydı sil
    console.log('Eski kaydı siliyorum...');
    await prisma.client.delete({
      where: {
        id: oldClient.id
      }
    });
    console.log('Eski kayıt silindi.');

    console.log('\n=== Birleştirme tamamlandı! ===');
    console.log(`Barış Manço artık tek kayıt: ${newClient.id}`);

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

mergeBarisClients();