import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncFatihClientBrokers() {
  try {
    console.log('Fatih Çelebigil\'in Client kaydındaki aracı kurum bilgilerini senkronize ediyorum...');
    
    // Fatih Çelebigil kullanıcısını bul
    const fatihUser = await prisma.user.findFirst({
      where: {
        name: 'Fatih Çelebigil'
      }
    });
    
    if (!fatihUser) {
      console.log('Fatih Çelebigil kullanıcısı bulunamadı.');
      return;
    }
    
    console.log(`Fatih Çelebigil kullanıcısı bulundu: ${fatihUser.id}`);
    
    // Fatih'in UserBroker kayıtlarını getir
    const userBrokers = await prisma.userBroker.findMany({
      where: {
        userId: fatihUser.id
      },
      include: {
        broker: true
      },
      orderBy: {
        broker: {
          name: 'asc'
        }
      }
    });
    
    console.log(`Fatih'in UserBroker kayıtları: ${userBrokers.length} adet`);
    userBrokers.forEach((ub, index) => {
      console.log(`${index + 1}. ${ub.broker.name}`);
    });
    
    // Broker isimlerini virgülle ayrılmış string olarak birleştir
    const brokerageFirm = userBrokers.map(ub => ub.broker.name).join(', ');
    console.log(`\nYeni brokerageFirm değeri: "${brokerageFirm}"`);
    
    // Fatih'in Client kaydını bul ve güncelle
    const fatihClient = await prisma.client.findFirst({
      where: {
        fullName: 'Fatih Çelebigil'
      }
    });
    
    if (!fatihClient) {
      console.log('Fatih Çelebigil\'in Client kaydı bulunamadı.');
      return;
    }
    
    console.log(`\nFatih'in Client kaydı bulundu: ${fatihClient.id}`);
    console.log(`Mevcut brokerageFirm: "${fatihClient.brokerageFirm}"`);
    
    // Client kaydını güncelle
    const updatedClient = await prisma.client.update({
      where: {
        id: fatihClient.id
      },
      data: {
        brokerageFirm: brokerageFirm
      }
    });
    
    console.log(`\n✓ Client kaydı başarıyla güncellendi!`);
    console.log(`Yeni brokerageFirm: "${updatedClient.brokerageFirm}"`);
    
    // Doğrulama: Güncellenmiş Client kaydını kontrol et
    const verifyClient = await prisma.client.findUnique({
      where: {
        id: fatihClient.id
      }
    });
    
    console.log(`\n--- Doğrulama ---`);
    console.log(`Client ID: ${verifyClient.id}`);
    console.log(`Ad: ${verifyClient.fullName}`);
    console.log(`Aracı Kurum: ${verifyClient.brokerageFirm}`);
    console.log(`Şehir: ${verifyClient.city}`);
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncFatihClientBrokers();
