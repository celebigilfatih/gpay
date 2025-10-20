import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function searchSpecificBrokers() {
  try {
    console.log('Allbatross ve Osmanlı brokerlarını arıyorum...');
    
    // Tüm brokerleri listele
    const allBrokers = await prisma.broker.findMany();
    console.log(`\nToplam broker sayısı: ${allBrokers.length}`);
    console.log('\nTüm brokerlar:');
    allBrokers.forEach((broker, index) => {
      console.log(`${index + 1}. ${broker.name} (${broker.code})`);
    });
    
    // Allbatross arama
    const allbatross = await prisma.broker.findMany({
      where: {
        OR: [
          { name: { contains: 'Allbatross', mode: 'insensitive' } },
          { name: { contains: 'Albatros', mode: 'insensitive' } },
          { code: { contains: 'ALLB', mode: 'insensitive' } },
          { code: { contains: 'ALBA', mode: 'insensitive' } }
        ]
      }
    });
    
    console.log(`\nAllbatross arama sonucu: ${allbatross.length} kayıt`);
    allbatross.forEach(broker => {
      console.log(`- ${broker.name} (${broker.code})`);
    });
    
    // Osmanlı arama
    const osmanli = await prisma.broker.findMany({
      where: {
        OR: [
          { name: { contains: 'Osmanlı', mode: 'insensitive' } },
          { name: { contains: 'Ottoman', mode: 'insensitive' } },
          { code: { contains: 'OSM', mode: 'insensitive' } }
        ]
      }
    });
    
    console.log(`\nOsmanlı arama sonucu: ${osmanli.length} kayıt`);
    osmanli.forEach(broker => {
      console.log(`- ${broker.name} (${broker.code})`);
    });
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

searchSpecificBrokers();
