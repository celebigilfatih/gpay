import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBarisCommissions() {
  try {
    console.log('Barış Manço müşterisinin komisyon verilerini kontrol ediyorum...');
    
    // Barış Manço müşterisini bul
    const barisClient = await prisma.client.findFirst({
      where: {
        fullName: 'Barış Manço'
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    });
    
    if (!barisClient) {
      console.log('❌ Barış Manço müşterisi bulunamadı!');
      return;
    }
    
    console.log('✅ Barış Manço müşterisi bulundu:', barisClient.id);
    console.log('   Kullanıcı:', barisClient.user?.name);
    
    // Barış Manço'nun işlemlerini kontrol et
    const transactions = await prisma.transaction.findMany({
      where: {
        clientId: barisClient.id
      },
      include: {
        stock: { select: { symbol: true, name: true } },
        broker: { select: { name: true } }
      }
    });
    
    console.log(`\nBarış Manço'nun toplam işlem sayısı: ${transactions.length}`);
    
    if (transactions.length === 0) {
      console.log('❌ Barış Manço\'nun hiç işlemi yok!');
      console.log('Bu yüzden Collections listesinde görünmüyor.');
      return;
    }
    
    // Komisyon içeren işlemleri kontrol et
    const commissionsTransactions = transactions.filter(t => t.commission !== null && t.commission !== 0);
    console.log(`Komisyon içeren işlem sayısı: ${commissionsTransactions.length}`);
    
    if (commissionsTransactions.length === 0) {
      console.log('❌ Barış Manço\'nun komisyon içeren işlemi yok!');
      console.log('Collections API sadece komisyon içeren işlemleri gösterir.');
      console.log('Bu yüzden Collections listesinde görünmüyor.');
    } else {
      console.log('✅ Komisyon içeren işlemler:');
      commissionsTransactions.forEach((t, index) => {
        console.log(`${index + 1}. ${t.stock?.symbol} - ${t.type} - Komisyon: ${t.commission} TL`);
      });
    }
    
    // Tüm işlemleri göster
    console.log('\nTüm işlemler:');
    transactions.forEach((t, index) => {
      console.log(`${index + 1}. ${t.stock?.symbol} - ${t.type} - Lot: ${t.lots} - Fiyat: ${t.price} - Komisyon: ${t.commission || 'YOK'}`);
    });
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBarisCommissions();

