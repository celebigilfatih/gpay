const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const users = await prisma.user.count();
    const clients = await prisma.client.count();
    const brokers = await prisma.broker.count();
    const stocks = await prisma.stock.count();
    const transactions = await prisma.transaction.count();
    const payments = await prisma.payment.count();
    const clientBrokers = await prisma.clientBroker.count();

    console.log('=== VERİTABANI DURUM RAPORU ===');
    console.log('Kullanıcılar (Users):', users);
    console.log('Müşteriler (Clients):', clients);
    console.log('Aracı Kurumlar (Brokers):', brokers);
    console.log('Hisse Senetleri (Stocks):', stocks);
    console.log('İşlemler (Transactions):', transactions);
    console.log('Ödemeler (Payments):', payments);
    console.log('Müşteri-Aracı İlişkileri (ClientBrokers):', clientBrokers);
    console.log('===============================');
    
    // Son eklenen kayıtları göster
    console.log('\n=== SON EKLENENLERİ ===');
    
    const latestUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { name: true, email: true, createdAt: true }
    });
    if (latestUser) {
      console.log('Son kullanıcı:', latestUser.name, '(' + latestUser.email + ')', latestUser.createdAt.toLocaleDateString('tr-TR'));
    }
    
    const latestClient = await prisma.client.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { fullName: true, city: true, createdAt: true }
    });
    if (latestClient) {
      console.log('Son müşteri:', latestClient.fullName, '(' + latestClient.city + ')', latestClient.createdAt.toLocaleDateString('tr-TR'));
    }
    
    const latestTransaction = await prisma.transaction.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { stock: true, client: true },
      take: 1
    });
    if (latestTransaction) {
      console.log('Son işlem:', latestTransaction.type, latestTransaction.stock.symbol, 
                  latestTransaction.lots + ' lot', latestTransaction.client.fullName,
                  latestTransaction.createdAt.toLocaleDateString('tr-TR'));
    }
    
  } catch (error) {
    console.error('Hata:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();