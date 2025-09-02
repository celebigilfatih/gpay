const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllClientsBrokers() {
  try {
    // Get all clients with their broker relationships
    const clients = await prisma.client.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        },
        brokers: {
          include: {
            broker: true
          }
        }
      }
    });

    console.log('=== TÜM MÜŞTERİLER VE ARACI KURUMLARI ===\n');
    
    clients.forEach((client, index) => {
      console.log(`${index + 1}. Müşteri: ${client.fullName}`);
      console.log(`   ID: ${client.id}`);
      console.log(`   Kullanıcı: ${client.user?.email || 'Bilinmiyor'}`);
      console.log(`   Telefon: ${client.phoneNumber}`);
      console.log(`   Firma: ${client.brokerageFirm}`);
      console.log(`   Şehir: ${client.city}`);
      
      if (client.brokers.length > 0) {
        console.log(`   Aracı Kurumlar (${client.brokers.length}):`);
        client.brokers.forEach((cb, brokerIndex) => {
          console.log(`     ${brokerIndex + 1}. ${cb.broker.name} (${cb.broker.code}) - ${cb.broker.isActive ? 'Aktif' : 'Pasif'}`);
        });
      } else {
        console.log(`   Aracı Kurum: Henüz hiç aracı kurum atanmamış`);
      }
      console.log('');
    });

    // Summary
    console.log('=== ÖZET ===');
    console.log(`Toplam müşteri sayısı: ${clients.length}`);
    const clientsWithBrokers = clients.filter(c => c.brokers.length > 0).length;
    console.log(`Aracı kurumu olan müşteriler: ${clientsWithBrokers}`);
    console.log(`Aracı kurumu olmayan müşteriler: ${clients.length - clientsWithBrokers}`);

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllClientsBrokers();