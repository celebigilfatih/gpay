import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBarisClient() {
  try {
    const barisUserId = '7b06b0ea-ec73-428c-8dcb-bb6b7fe0b315';
    
    console.log('Barış Manço\'nun client kayıtlarını kontrol ediyorum...');
    
    // Barış'ın tüm client kayıtlarını bul
    const clients = await prisma.client.findMany({
      where: {
        userId: barisUserId
      },
      include: {
        brokers: {
          include: {
            broker: true
          }
        }
      }
    });
    
    console.log(`Barış Manço'nun client sayısı: ${clients.length}`);
    
    if (clients.length > 0) {
      console.log('\nClient detayları:');
      clients.forEach((client, index) => {
        console.log(`${index + 1}. ID: ${client.id}`);
        console.log(`   Ad: ${client.fullName}`);
        console.log(`   Telefon: ${client.phoneNumber}`);
        console.log(`   Şehir: ${client.city}`);
        console.log(`   Aracı Kurum: ${client.brokerageFirm}`);
        console.log(`   Oluşturulma: ${client.createdAt}`);
        
        if (client.brokers && client.brokers.length > 0) {
          console.log(`   Atanmış Aracı Kurumlar (${client.brokers.length}):`);
          client.brokers.forEach((cb, brokerIndex) => {
            console.log(`     ${brokerIndex + 1}. ${cb.broker.name}`);
          });
        } else {
          console.log('   Atanmış aracı kurum yok');
        }
        console.log('');
      });
    } else {
      console.log('Barış Manço\'nun hiç client kaydı bulunamadı.');
    }
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBarisClient();
