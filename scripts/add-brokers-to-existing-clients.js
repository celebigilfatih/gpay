const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addBrokersToExistingClients() {
  try {
    console.log('=== MEVCUT ARACI KURUMLAR KONTROL EDİLİYOR ===');
    
    // Get all brokers
    const brokers = await prisma.broker.findMany();
    console.log(`Mevcut aracı kurum sayısı: ${brokers.length}`);
    brokers.forEach((b, i) => console.log(`  ${i+1}. ${b.name} (${b.code})`));
    console.log('');

    // Get clients without brokers
    const clientsWithoutBrokers = await prisma.client.findMany({
      where: {
        brokers: {
          none: {}
        }
      },
      include: {
        user: true
      }
    });

    console.log(`Aracı kurumu olmayan müşteri sayısı: ${clientsWithoutBrokers.length}\n`);

    if (clientsWithoutBrokers.length === 0) {
      console.log('Tüm müşterilerin aracı kurumu var!');
      return;
    }

    // Create brokers if none exist
    if (brokers.length === 0) {
      console.log('Hiç aracı kurum yok, oluşturuluyor...');
      await prisma.broker.createMany({
        data: [
          { name: 'Vakıf Yatırım', code: 'VY' },
          { name: 'Osmanlı Yatırım', code: 'OY' },
          { name: 'Akbank Yatırım', code: 'AY' },
          { name: 'Allbatross Yatırım', code: 'ALY' }
        ]
      });
      console.log('Aracı kurumlar oluşturuldu!');
    }

    // Get updated broker list
    const updatedBrokers = await prisma.broker.findMany();
    
    // Add brokers to clients
    for (const client of clientsWithoutBrokers) {
      console.log(`\n--- ${client.fullName} için aracı kurumlar ekleniyor ---`);
      
      // Add all active brokers to each client
      for (const broker of updatedBrokers) {
        const existingRelation = await prisma.clientBroker.findUnique({
          where: {
            clientId_brokerId: {
              clientId: client.id,
              brokerId: broker.id
            }
          }
        });

        if (!existingRelation) {
          await prisma.clientBroker.create({
            data: {
              clientId: client.id,
              brokerId: broker.id
            }
          });
          console.log(`  ✓ ${broker.name} eklendi`);
        } else {
          console.log(`  - ${broker.name} zaten var`);
        }
      }
    }

    // Verify results
    console.log('\n=== SONUÇ KONTROLÜ ===');
    const finalClients = await prisma.client.findMany({
      include: {
        brokers: {
          include: {
            broker: true
          }
        }
      }
    });

    finalClients.forEach(client => {
      console.log(`${client.fullName}: ${client.brokers.length} aracı kurum`);
    });

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addBrokersToExistingClients();