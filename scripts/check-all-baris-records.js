const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllBarisRecords() {
  try {
    console.log('=== Barış Manço ile ilgili tüm kayıtları kontrol ediyorum ===\n');

    // 1. Barış Manço kullanıcılarını kontrol et
    console.log('1. KULLANICILAR:');
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: 'Barış' } },
          { name: { contains: 'Manço' } },
          { email: { contains: 'baris' } },
          { email: { contains: 'manco' } }
        ]
      }
    });
    
    console.log(`Toplam ${users.length} kullanıcı bulundu:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id}`);
      console.log(`     İsim: ${user.name}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Oluşturulma: ${user.createdAt}`);
      console.log('');
    });

    // 2. Barış Manço müşterilerini kontrol et
    console.log('2. MÜŞTERİLER:');
    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { fullName: { contains: 'Barış' } },
          { fullName: { contains: 'Manço' } },
          { phoneNumber: { contains: 'baris' } }
        ]
      },
      include: {
        user: true,
        brokers: {
          include: {
            broker: true
          }
        }
      }
    });

    console.log(`Toplam ${clients.length} müşteri bulundu:`);
    clients.forEach((client, index) => {
      console.log(`  ${index + 1}. ID: ${client.id}`);
      console.log(`     İsim: ${client.fullName}`);
      console.log(`     Telefon: ${client.phoneNumber}`);
      console.log(`     Bağlı Kullanıcı: ${client.user?.name} (${client.user?.email})`);
      console.log(`     Broker Sayısı: ${client.brokers.length}`);
      console.log(`     Oluşturulma: ${client.createdAt}`);
      console.log('');
    });

    // 3. Barış Manço ile ilgili işlemleri kontrol et
    console.log('3. İŞLEMLER:');
    const transactions = await prisma.transaction.findMany({
      where: {
        client: {
          OR: [
            { fullName: { contains: 'Barış' } },
            { fullName: { contains: 'Manço' } }
          ]
        }
      },
      include: {
        client: true,
        broker: true,
        stock: true
      }
    });

    console.log(`Toplam ${transactions.length} işlem bulundu:`);
    transactions.forEach((transaction, index) => {
      console.log(`  ${index + 1}. ID: ${transaction.id}`);
      console.log(`     Müşteri: ${transaction.client.fullName}`);
      console.log(`     Broker: ${transaction.broker?.name || 'Belirtilmemiş'}`);
      console.log(`     Hisse: ${transaction.stock.symbol} (${transaction.stock.name})`);
      console.log(`     Tip: ${transaction.type}`);
      console.log(`     Lot: ${transaction.lots}`);
      console.log(`     Fiyat: ${transaction.price}`);
      console.log(`     Komisyon: ${transaction.commission || 'Yok'}`);
      console.log(`     Tarih: ${transaction.date}`);
      console.log('');
    });

    // 4. Ödemeleri kontrol et
    console.log('4. ÖDEMELER:');
    const payments = await prisma.payment.findMany({
      where: {
        client: {
          OR: [
            { fullName: { contains: 'Barış' } },
            { fullName: { contains: 'Manço' } }
          ]
        }
      },
      include: {
        client: true
      }
    });

    console.log(`Toplam ${payments.length} ödeme bulundu:`);
    payments.forEach((payment, index) => {
      console.log(`  ${index + 1}. ID: ${payment.id}`);
      console.log(`     Müşteri: ${payment.client.fullName}`);
      console.log(`     Miktar: ${payment.amount}`);
      console.log(`     Tarih: ${payment.date}`);
      console.log('');
    });

    console.log('=== ÖZET ===');
    console.log(`Toplam ${users.length} kullanıcı, ${clients.length} müşteri, ${transactions.length} işlem, ${payments.length} ödeme`);

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllBarisRecords();