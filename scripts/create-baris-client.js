import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createBarisClient() {
  try {
    const barisUserId = '7610e9fa-4218-49a8-be54-73689005bbc5';
    
    console.log('Barış Manço için client kaydı oluşturuluyor...');
    
    // Önce client kaydının var olup olmadığını kontrol et
    const existingClient = await prisma.client.findFirst({
      where: {
        userId: barisUserId,
        fullName: 'Barış Manço'
      }
    });
    
    let client;
    if (existingClient) {
      console.log('Barış Manço client kaydı zaten mevcut:', existingClient.id);
      client = existingClient;
    } else {
      // Client kaydı oluştur
      client = await prisma.client.create({
        data: {
          userId: barisUserId,
          fullName: 'Barış Manço',
          phoneNumber: '+90 555 123 4567',
          city: 'İstanbul',
          brokerageFirm: 'Albatros Yatırım Menkul Değerler A.Ş.'
        }
      });
      
      console.log('Barış Manço client kaydı oluşturuldu:', client.id);
    }
    
    // Aracı kurumları bul
    const brokers = await prisma.broker.findMany({
      where: {
        OR: [
          { name: 'Albatros Yatırım Menkul Değerler A.Ş.' },
          { name: 'Osmanlı Yatırım Menkul Değerler A.Ş.' },
          { name: 'A1 Capital Yatırım Menkul Değerler A.Ş.' },
          { name: 'Acar Menkul Değerler A.Ş.' }
        ]
      }
    });
    
    console.log('Bulunan aracı kurumlar:', brokers.map(b => b.name));
    
    // ClientBroker ilişkilerini oluştur
    for (const broker of brokers) {
      const existingClientBroker = await prisma.clientBroker.findUnique({
        where: {
          clientId_brokerId: {
            clientId: client.id,
            brokerId: broker.id
          }
        }
      });
      
      if (!existingClientBroker) {
        await prisma.clientBroker.create({
          data: {
            clientId: client.id,
            brokerId: broker.id
          }
        });
        console.log(`${broker.name} aracı kurumu ${client.fullName} client'ına atandı`);
      } else {
        console.log(`${broker.name} aracı kurumu zaten ${client.fullName} client'ına atanmış`);
      }
    }
    
    console.log('\nBarış Manço client kaydı ve aracı kurum atamaları tamamlandı!');
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBarisClient();