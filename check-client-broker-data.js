import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkClientBrokerData() {
  try {
    console.log('=== CLIENT BROKER VERİLERİ KONTROL EDİLİYOR ===');
    
    // Tüm müşterileri getir
    const clients = await prisma.client.findMany({
      include: {
        user: { select: { name: true, email: true } },
        brokers: {
          include: {
            broker: true
          }
        }
      }
    });
    
    console.log(`Toplam müşteri sayısı: ${clients.length}`);
    
    clients.forEach((client, index) => {
      console.log(`\n${index + 1}. Müşteri: ${client.fullName}`);
      console.log(`   User: ${client.user.name} (${client.user.email})`);
      console.log(`   ID: ${client.id}`);
      console.log(`   Aracı Kurum Sayısı: ${client.brokers.length}`);
      
      if (client.brokers.length === 0) {
        console.log('   ❌ Hiç aracı kurum atanmamış!');
      } else {
        console.log('   ✅ Atanmış Aracı Kurumlar:');
        client.brokers.forEach((cb, i) => {
          console.log(`      ${i + 1}. ${cb.broker.name} (${cb.broker.code})`);
        });
      }
    });
    
    // ClientBroker tablosundaki toplam kayıt sayısı
    const totalClientBrokers = await prisma.clientBroker.count();
    console.log(`\n=== ÖZET ===`);
    console.log(`Toplam ClientBroker kayıt sayısı: ${totalClientBrokers}`);
    
    // Aracı kurumu olmayan müşteriler
    const clientsWithoutBrokers = clients.filter(c => c.brokers.length === 0);
    console.log(`Aracı kurumu olmayan müşteri sayısı: ${clientsWithoutBrokers.length}`);
    
    if (clientsWithoutBrokers.length > 0) {
      console.log('\n❌ Aracı kurumu olmayan müşteriler:');
      clientsWithoutBrokers.forEach(client => {
        console.log(`   - ${client.fullName} (${client.user.email})`);
      });
    }
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientBrokerData();
