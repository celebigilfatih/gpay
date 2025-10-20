import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTransaction() {
  try {
    const transactionId = '9752b225-437d-4d39-9afa-e4200323439d';
    
    console.log('İşlem ID kontrol ediliyor:', transactionId);
    
    const transaction = await prisma.transaction.findUnique({
      where: {
        id: transactionId
      },
      include: {
        client: true,
        stock: true,
        broker: true
      }
    });
    
    if (transaction) {
      console.log('İşlem bulundu:');
      console.log('- ID:', transaction.id);
      console.log('- Tip:', transaction.type);
      console.log('- Müşteri:', transaction.client.fullName);
      console.log('- Hisse:', transaction.stock?.symbol || 'N/A');
      console.log('- Aracı kurum:', transaction.broker?.name || transaction.brokerageFirm);
      console.log('- Müşteri User ID:', transaction.client.userId);
    } else {
      console.log('İşlem bulunamadı!');
      
      // Tüm işlemleri listele
      const allTransactions = await prisma.transaction.findMany({
        take: 5,
        include: {
          client: true
        }
      });
      
      console.log('\nMevcut işlemler (ilk 5):');
      allTransactions.forEach((t, index) => {
        console.log(`${index + 1}. ${t.id} - ${t.client.fullName} - ${t.type}`);
      });
    }
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransaction();
