import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteBarisMancoData() {
  console.log('=== Barış Manço verilerini silme işlemi başlıyor ===\n');

  try {
    // 1. Önce mevcut verileri kontrol et
    console.log('1. Mevcut verileri kontrol ediyorum...');
    
    const user = await prisma.user.findFirst({
      where: { name: { contains: 'Barış Manço' } }
    });

    if (!user) {
      console.log('❌ Barış Manço kullanıcısı bulunamadı!');
      return;
    }

    const clients = await prisma.client.findMany({
      where: { userId: user.id },
      include: {
        transactions: true,
        payments: true,
        brokers: true
      }
    });

    if (clients.length === 0) {
      console.log('❌ Barış Manço müşterisi bulunamadı!');
      return;
    }

    const client = clients[0]; // Tek müşteri olmalı
    console.log(`✅ Müşteri bulundu: ${client.fullName} (ID: ${client.id})`);
    console.log(`   - ${client.transactions.length} işlem`);
    console.log(`   - ${client.payments.length} ödeme`);
    console.log(`   - ${client.brokers.length} broker ilişkisi\n`);

    // 2. İlişkili verileri sil (sıralama önemli - foreign key constraints)
    console.log('2. İlişkili verileri siliyorum...');

    // 2a. Önce transactions'ları sil
    if (client.transactions.length > 0) {
      const deletedTransactions = await prisma.transaction.deleteMany({
        where: { clientId: client.id }
      });
      console.log(`✅ ${deletedTransactions.count} işlem silindi`);
    }

    // 2b. Payments'ları sil
    if (client.payments.length > 0) {
      const deletedPayments = await prisma.payment.deleteMany({
        where: { clientId: client.id }
      });
      console.log(`✅ ${deletedPayments.count} ödeme silindi`);
    }

    // 2c. Client-Broker ilişkilerini sil
    if (client.brokers.length > 0) {
      const deletedClientBrokers = await prisma.clientBroker.deleteMany({
        where: { clientId: client.id }
      });
      console.log(`✅ ${deletedClientBrokers.count} broker ilişkisi silindi`);
    }

    // 3. Müşteriyi sil
    console.log('\n3. Müşteriyi siliyorum...');
    const deletedClient = await prisma.client.delete({
      where: { id: client.id }
    });
    console.log(`✅ Müşteri silindi: ${deletedClient.fullName}`);

    // 4. Kullanıcıyı sil
    console.log('\n4. Kullanıcıyı siliyorum...');
    const deletedUser = await prisma.user.delete({
      where: { id: user.id }
    });
    console.log(`✅ Kullanıcı silindi: ${deletedUser.name}`);

    console.log('\n=== ✅ Barış Manço verileri başarıyla silindi! ===');

  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteBarisMancoData();
