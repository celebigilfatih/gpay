import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedUserBrokers() {
  try {
    console.log('Kullanıcı-aracı kurum ilişkileri ekleniyor...');
    
    // İlk kullanıcıyı bul
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('Kullanıcı bulunamadı. Önce bir kullanıcı oluşturun.');
      return;
    }
    
    console.log(`Kullanıcı bulundu: ${user.name} (${user.email})`);
    
    // İlk 5 aracı kurumu bul
    const brokers = await prisma.broker.findMany({
      take: 5,
      where: {
        isActive: true
      }
    });
    
    if (brokers.length === 0) {
      console.log('Aracı kurum bulunamadı. Önce aracı kurumları ekleyin.');
      return;
    }
    
    console.log(`${brokers.length} aracı kurum bulundu.`);
    
    // Kullanıcıya aracı kurumları ata
    for (const broker of brokers) {
      const existingUserBroker = await prisma.userBroker.findUnique({
        where: {
          userId_brokerId: {
            userId: user.id,
            brokerId: broker.id
          }
        }
      });
      
      if (!existingUserBroker) {
        await prisma.userBroker.create({
          data: {
            userId: user.id,
            brokerId: broker.id
          }
        });
        console.log(`✓ ${broker.name} kullanıcıya atandı`);
      } else {
        console.log(`- ${broker.name} zaten atanmış`);
      }
    }
    
    console.log('\nKullanıcı-aracı kurum ilişkileri başarıyla işlendi!');
    
    const totalUserBrokers = await prisma.userBroker.count({
      where: {
        userId: user.id
      }
    });
    console.log(`Kullanıcının toplam aracı kurum sayısı: ${totalUserBrokers}`);
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUserBrokers();