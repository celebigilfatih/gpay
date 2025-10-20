import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addAlbatrosToBaris() {
  try {
    console.log('Barış Manço client\'ına Allbatross aracı kurumunu ekliyorum...');
    
    // Barış Manço client'ını bul
    const barisClient = await prisma.client.findFirst({
      where: {
        fullName: 'Barış Manço'
      }
    });
    
    if (!barisClient) {
      console.log('Barış Manço client kaydı bulunamadı!');
      return;
    }
    
    console.log('Barış Manço client bulundu:', barisClient.id);
    
    // Allbatross aracı kurumunu bul
    const allbatrossBroker = await prisma.broker.findFirst({
      where: {
        name: 'Allbatross Yatırım Menkul Değerler A.Ş.'
      }
    });
    
    if (!allbatrossBroker) {
      console.log('Allbatross aracı kurumu bulunamadı!');
      return;
    }
    
    console.log('Allbatross aracı kurumu bulundu:', allbatrossBroker.name);
    
    // ClientBroker ilişkisini kontrol et
    const existingClientBroker = await prisma.clientBroker.findUnique({
      where: {
        clientId_brokerId: {
          clientId: barisClient.id,
          brokerId: allbatrossBroker.id
        }
      }
    });
    
    if (existingClientBroker) {
      console.log('Allbatross aracı kurumu zaten Barış Manço client\'ına atanmış');
    } else {
      // ClientBroker ilişkisini oluştur
      await prisma.clientBroker.create({
        data: {
          clientId: barisClient.id,
          brokerId: allbatrossBroker.id
        }
      });
      console.log('Allbatross aracı kurumu Barış Manço client\'ına atandı!');
    }
    
    // Güncel aracı kurum listesini göster
    const updatedClient = await prisma.client.findUnique({
      where: { id: barisClient.id },
      include: {
        brokers: {
          include: {
            broker: true
          }
        }
      }
    });
    
    console.log('\nBarış Manço\'nun güncel aracı kurumları:');
    updatedClient.brokers.forEach((cb, index) => {
      console.log(`${index + 1}. ${cb.broker.name}`);
    });
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAlbatrosToBaris();
