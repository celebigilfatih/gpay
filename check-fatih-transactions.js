import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFatihTransactions() {
  try {
    const fatihClientId = '1178a348-355e-4d7d-b67f-52902cedcc1e';
    
    console.log('Fatih Çelebigil müşterisinin transaction verilerini kontrol ediyorum...');
    
    // Fatih'in tüm BUY transaction'larını getir
    const transactions = await prisma.transaction.findMany({
      where: {
        clientId: fatihClientId,
        type: 'BUY'
      },
      include: {
        stock: true,
        broker: true
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    console.log(`\nFatih Çelebigil'in toplam BUY transaction sayısı: ${transactions.length}`);
    
    if (transactions.length > 0) {
      console.log('\nTransaction detayları:');
      transactions.forEach((transaction, index) => {
        console.log(`${index + 1}. ID: ${transaction.id}`);
        console.log(`   Hisse: ${transaction.stock?.symbol || 'N/A'}`);
        console.log(`   Lot: ${transaction.lots}`);
        console.log(`   Fiyat: ${transaction.price}`);
        console.log(`   Toplam: ${transaction.lots * transaction.price}`);
        console.log(`   Broker: ${transaction.broker?.name || transaction.brokerageFirm || 'N/A'}`);
        console.log(`   Tarih: ${transaction.date}`);
        console.log('');
      });
      
      // Hisse bazında grupla ve lot toplamlarını hesapla
      const groupedByStock = transactions.reduce((acc, transaction) => {
        const stockKey = transaction.stockId;
        if (!acc[stockKey]) {
          acc[stockKey] = {
            stock: transaction.stock,
            transactions: [],
            totalLots: 0,
            totalCost: 0
          };
        }
        acc[stockKey].transactions.push(transaction);
        acc[stockKey].totalLots += transaction.lots;
        acc[stockKey].totalCost += (transaction.lots * transaction.price);
        return acc;
      }, {});
      
      console.log('\n=== HİSSE BAZINDA ÖZET ===');
      Object.values(groupedByStock).forEach((group, index) => {
        console.log(`${index + 1}. ${group.stock?.symbol || 'N/A'}`);
        console.log(`   Toplam Lot: ${group.totalLots}`);
        console.log(`   Toplam Maliyet: ${group.totalCost.toFixed(2)}`);
        console.log(`   Ortalama Fiyat: ${(group.totalCost / group.totalLots).toFixed(2)}`);
        console.log(`   İşlem Sayısı: ${group.transactions.length}`);
        console.log('');
      });
    } else {
      console.log('Fatih Çelebigil\'in hiç BUY transaction kaydı yok!');
    }
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFatihTransactions();