import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testUpdatedStockCostsAPI() {
  try {
    // Fatih Çelebigil'in user ID'si
    const testUserId = 'c71a90ca-93ac-4add-b9d7-880f38ac0a97';
    
    console.log('Güncellenmiş Stock Costs API mantığını test ediyoruz...');
    
    // Kullanıcının müşterilerine ait tüm işlemleri getir (BUY ve SELL)
    const transactions = await prisma.transaction.findMany({
      where: {
        client: {
          userId: testUserId
        }
      },
      select: {
        stockId: true,
        clientId: true,
        brokerId: true,
        lots: true,
        price: true,
        type: true
      }
    });

    console.log(`Toplam işlem sayısı: ${transactions.length}`);
    
    // Transaction'ları manuel olarak grupla
    const groupedTransactions = transactions.reduce((acc, transaction) => {
      const key = `${transaction.stockId}-${transaction.clientId}-${transaction.brokerId || 'null'}`;
      if (!acc[key]) {
        acc[key] = {
          stockId: transaction.stockId,
          clientId: transaction.clientId,
          brokerId: transaction.brokerId,
          transactions: []
        };
      }
      acc[key].transactions.push(transaction);
      return acc;
    }, {});

    console.log(`Grup sayısı: ${Object.keys(groupedTransactions).length}`);

    // Her grup için detaylı bilgileri getir
    const detailedStockCosts = await Promise.all(
      Object.values(groupedTransactions).map(async (group) => {
        const client = await prisma.client.findUnique({
          where: { id: group.clientId },
          select: { id: true, fullName: true }
        });

        const stock = await prisma.stock.findUnique({
          where: { id: group.stockId },
          select: { id: true, symbol: true, name: true }
        });

        const broker = group.brokerId ? await prisma.broker.findUnique({
          where: { id: group.brokerId },
          select: { id: true, name: true }
        }) : null;

        // Net lot ve maliyet hesapla (BUY pozitif, SELL negatif)
        const totalLots = group.transactions.reduce((sum, t) => {
          return sum + (t.type === 'BUY' ? t.lots : -t.lots);
        }, 0);
        const totalCost = group.transactions.reduce((sum, t) => {
          return sum + (t.type === 'BUY' ? (t.lots * t.price) : -(t.lots * t.price));
        }, 0);
        // İlk alış fiyatını kullan (sadece BUY işlemlerinden)
        const buyTransactions = group.transactions.filter(t => t.type === 'BUY');
        const purchasePrice = buyTransactions.length > 0 ? buyTransactions[0].price : 0;

        return {
          stockId: group.stockId,
          stock: stock,
          client: client,
          broker: broker,
          totalLots: totalLots,
          purchasePrice: purchasePrice,
          totalCost: totalCost,
          transactionDetails: group.transactions.map(t => `${t.type}: ${t.lots} lot @ ${t.price} TL`)
        };
      })
    );

    console.log('\nDetaylı sonuçlar:');
    detailedStockCosts.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.client?.fullName} - ${item.stock?.symbol} (${item.broker?.name || 'Broker yok'})`);
      console.log(`   Net Lot: ${item.totalLots}`);
      console.log(`   İlk Alış Fiyatı: ${item.purchasePrice} TL`);
      console.log(`   Net Maliyet: ${item.totalCost.toFixed(2)} TL`);
      console.log(`   İşlemler: ${item.transactionDetails.join(', ')}`);
    });

    // Fatih Çelebigil'e özel filtreleme
    const fatihResults = detailedStockCosts.filter(item => 
      item.client?.fullName === 'Fatih Çelebigil'
    );
    
    if (fatihResults.length > 0) {
      console.log('\n=== FATIH ÇELEBİGİL SONUÇLARI ===');
      fatihResults.forEach((item, index) => {
        console.log(`${index + 1}. ${item.stock?.symbol} (${item.broker?.name || 'Broker yok'}): Net ${item.totalLots} lot`);
      });
    }

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdatedStockCostsAPI();
