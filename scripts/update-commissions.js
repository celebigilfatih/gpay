import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCommissions() {
  try {
    console.log('Mevcut işlemlerin komisyonları güncelleniyor...');
    
    // Tüm SELL işlemlerini getir
    const sellTransactions = await prisma.transaction.findMany({
      where: {
        type: 'SELL'
      },
      include: {
        client: true,
        stock: true
      }
    });
    
    console.log(`Toplam ${sellTransactions.length} SELL işlemi bulundu.`);
    
    let updatedCount = 0;
    
    for (const transaction of sellTransactions) {
      if (transaction.profit !== null) {
        // Yeni komisyon hesaplama: kar olan işlemlerde +komisyon, zarar olan işlemlerde -komisyon
        const newCommission = transaction.profit * 0.3;
        
        await prisma.transaction.update({
          where: {
            id: transaction.id
          },
          data: {
            commission: newCommission
          }
        });
        
        console.log(`İşlem ${transaction.id} güncellendi:`);
        console.log(`  - Müşteri: ${transaction.client.fullName}`);
        console.log(`  - Hisse: ${transaction.stock?.symbol || 'N/A'}`);
        console.log(`  - Kar/Zarar: ${transaction.profit}`);
        console.log(`  - Yeni Komisyon: ${newCommission}`);
        console.log('---');
        
        updatedCount++;
      }
    }
    
    console.log(`\nToplam ${updatedCount} işlem güncellendi.`);
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCommissions();