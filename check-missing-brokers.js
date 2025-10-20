import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkMissingBrokers() {
  try {
    console.log('=== ARACI KURUM EKSİK MÜŞTERİLER KONTROL ===');
    
    // Tüm müşterileri ve aracı kurumlarını getir
    const clients = await prisma.client.findMany({
      include: {
        user: { select: { name: true, email: true } },
        brokers: {
          include: {
            broker: { select: { id: true, name: true, code: true } }
          }
        }
      }
    });
    
    console.log(`Toplam müşteri sayısı: ${clients.length}`);
    
    // Aracı kurumu olmayan müşteriler
    const clientsWithoutBrokers = clients.filter(c => c.brokers.length === 0);
    console.log(`\nAracı kurumu olmayan müşteri sayısı: ${clientsWithoutBrokers.length}`);
    
    if (clientsWithoutBrokers.length > 0) {
      console.log('\n❌ Aracı kurumu olmayan müşteriler:');
      clientsWithoutBrokers.forEach((client, index) => {
        console.log(`${index + 1}. ${client.fullName} (ID: ${client.id})`);
        console.log(`   User: ${client.user.name} - ${client.user.email}`);
      });
      
      console.log('\n=== BU MÜŞTERİLERE ARACI KURUM ATAMA ÖNERİSİ ===');
      
      // İlk birkaç aracı kurumu getir
      const sampleBrokers = await prisma.broker.findMany({
        take: 5,
        select: { id: true, name: true, code: true }
      });
      
      console.log('\nMevcut aracı kurumlar (ilk 5):');
      sampleBrokers.forEach((broker, index) => {
        console.log(`${index + 1}. ${broker.name} (${broker.code}) - ID: ${broker.id}`);
      });
      
      console.log('\n=== ÇÖZÜM ÖNERİSİ ===');
      console.log('Bu müşterilere aracı kurum atamak için şu komutu çalıştırabilirsiniz:');
      console.log('node add-brokers-to-existing-clients.js');
    } else {
      console.log('\n✅ Tüm müşterilerin aracı kurumu mevcut!');
    }
    
    // Aracı kurumu olan müşteriler için detay
    const clientsWithBrokers = clients.filter(c => c.brokers.length > 0);
    if (clientsWithBrokers.length > 0) {
      console.log(`\n✅ Aracı kurumu olan müşteriler (${clientsWithBrokers.length}):`);
      clientsWithBrokers.forEach((client, index) => {
        console.log(`${index + 1}. ${client.fullName}`);
        console.log(`   Aracı Kurumlar: ${client.brokers.map(cb => cb.broker.name).join(', ')}`);
      });
    }
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMissingBrokers();
