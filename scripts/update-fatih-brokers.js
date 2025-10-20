import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateFatihBrokers() {
  try {
    const fatihUserId = 'c71a90ca-93ac-4add-b9d7-880f38ac0a97';
    
    console.log('Fatih Çelebigil\'in mevcut brokerlarını siliyorum...');
    
    // Mevcut broker kayıtlarını sil
    const deletedRecords = await prisma.userBroker.deleteMany({
      where: {
        userId: fatihUserId
      }
    });
    
    console.log(`${deletedRecords.count} kayıt silindi.`);
    
    // Allbatross ve Osmanlı brokerlarını bul
    const allbatross = await prisma.broker.findFirst({
      where: { name: 'Allbatross Yatırım Menkul Değerler A.Ş.' }
    });
    
    const osmanli = await prisma.broker.findFirst({
      where: { name: 'Osmanlı Yatırım Menkul Değerler A.Ş.' }
    });
    
    if (!allbatross || !osmanli) {
      console.error('Allbatross veya Osmanlı broker bulunamadı!');
      return;
    }
    
    console.log('Yeni brokerları ekliyorum...');
    
    // Yeni broker kayıtlarını ekle
    await prisma.userBroker.createMany({
      data: [
        {
          userId: fatihUserId,
          brokerId: allbatross.id
        },
        {
          userId: fatihUserId,
          brokerId: osmanli.id
        }
      ]
    });
    
    console.log('Fatih Çelebigil\'in brokerları güncellendi:');
    console.log('1. Allbatross Yatırım Menkul Değerler A.Ş.');
    console.log('2. Osmanlı Yatırım Menkul Değerler A.Ş.');
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateFatihBrokers();
