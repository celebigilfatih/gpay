import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFatihClient() {
  try {
    const fatihUserId = 'c71a90ca-93ac-4add-b9d7-880f38ac0a97';
    
    console.log('Fatih Çelebigil\'in client kayıtlarını kontrol ediyorum...');
    
    // Fatih'in tüm client kayıtlarını bul
    const clients = await prisma.client.findMany({
      where: {
        userId: fatihUserId
      }
    });
    
    console.log(`Fatih Çelebigil\'in client sayısı: ${clients.length}`);
    
    if (clients.length > 0) {
      console.log('\nClient detayları:');
      clients.forEach((client, index) => {
        console.log(`${index + 1}. ID: ${client.id}`);
        console.log(`   Ad: ${client.fullName}`);
        console.log(`   Telefon: ${client.phoneNumber}`);
        console.log(`   Şehir: ${client.city}`);
        console.log(`   Aracı Kurum: ${client.brokerageFirm}`);
        console.log(`   Oluşturulma: ${client.createdAt}`);
        console.log('');
      });
    } else {
      console.log('Fatih Çelebigil\'in hiç client kaydı yok!');
      
      // Tüm clientları listele
      const allClients = await prisma.client.findMany();
      console.log(`\nToplam client sayısı: ${allClients.length}`);
      
      if (allClients.length > 0) {
        console.log('\nTüm clientlar:');
        allClients.forEach((client, index) => {
          console.log(`${index + 1}. ${client.fullName} (${client.id}) - User: ${client.userId}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFatihClient();