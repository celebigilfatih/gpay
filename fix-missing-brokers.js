import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixMissingBrokers() {
  try {
    console.log('=== ARACI KURUM EKSİK MÜŞTERİLERE ATAMA ===');
    
    // Aracı kurumu olmayan müşterileri bul
    const clientsWithoutBrokers = await prisma.client.findMany({
      where: {
        brokers: {
          none: {}
        }
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    });
    
    console.log(`Aracı kurumu olmayan müşteri sayısı: ${clientsWithoutBrokers.length}`);
    
    if (clientsWithoutBrokers.length === 0) {
      console.log('✅ Tüm müşterilerin aracı kurumu mevcut!');
      return;
    }
    
    // İlk birkaç aracı kurumu getir
    const brokers = await prisma.broker.findMany({
      take: 3,
      select: { id: true, name: true, code: true }
    });
    
    console.log(`\nKullanılacak aracı kurumlar:`);
    brokers.forEach((broker, index) => {
      console.log(`${index + 1}. ${broker.name} (${broker.code})`);
    });
    
    // Her müşteriye aracı kurumları ata
    for (const client of clientsWithoutBrokers) {
      console.log(`\n${client.fullName} için aracı kurum ataması yapılıyor...`);
      
      for (const broker of brokers) {
        try {
          await prisma.clientBroker.create({
            data: {
              clientId: client.id,
              brokerId: broker.id
            }
          });
          console.log(`  ✅ ${broker.name} atandı`);
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`  ⚠️  ${broker.name} zaten atanmış`);
          } else {
            console.log(`  ❌ ${broker.name} atanamadı:`, error.message);
          }
        }
      }
    }
    
    console.log('\n=== KONTROL ===');
    
    // Tekrar kontrol et
    const updatedClientsWithoutBrokers = await prisma.client.findMany({
      where: {
        brokers: {
          none: {}
        }
      }
    });
    
    console.log(`Aracı kurumu olmayan müşteri sayısı (güncel): ${updatedClientsWithoutBrokers.length}`);
    
    if (updatedClientsWithoutBrokers.length === 0) {
      console.log('✅ Tüm müşterilere aracı kurum başarıyla atandı!');
    }
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingBrokers();
