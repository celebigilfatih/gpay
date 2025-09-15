const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCorrectedCostCalculation() {
  try {
    // Fatih Çelebigil'in user ID'si
    const testUserId = 'c71a90ca-93ac-4add-b9d7-880f38ac0a97';
    
    console.log('Düzeltilmiş maliyet hesaplama mantığını test ediyoruz...');
    console.log('====================================================');
    
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
        type: true,
        createdAt: true
      }
    });

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

        // Net lot hesapla (BUY pozitif, SELL negatif)
        const totalLots = group.transactions.reduce((sum, t) => {
          return sum + (t.type === 'BUY' ? t.lots : -t.lots);
        }, 0);
        
        // Kalan lotların maliyetini hesapla (FIFO mantığı)
        let remainingLots = totalLots;
        let totalCost = 0;
        
        if (remainingLots > 0) {
          // Sadece BUY işlemlerini al ve sırala
          const buyTransactions = group.transactions
            .filter(t => t.type === 'BUY')
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          
          let lotsToCalculate = remainingLots;
          for (const buyTx of buyTransactions) {
            if (lotsToCalculate <= 0) break;
            
            const lotsFromThisTx = Math.min(lotsToCalculate, buyTx.lots);
            totalCost += lotsFromThisTx * buyTx.price;
            lotsToCalculate -= lotsFromThisTx;
          }
        }
        
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
          avgCost: totalLots > 0 ? totalCost / totalLots : 0
        };
      })
    );

    // Fatih Çelebigil'e özel filtreleme
    const fatihResults = detailedStockCosts.filter(item => 
      item.client?.fullName === 'Fatih Çelebigil'
    );
    
    console.log('=== FATIH ÇELEBİGİL - DÜZELTİLMİŞ MALİYET HESAPLAMALARI ===');
    fatihResults.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.stock?.symbol} (${item.broker?.name || 'Broker yok'})`);
      console.log(`   Net Lot: ${item.totalLots}`);
      console.log(`   Toplam Maliyet: ${item.totalCost.toFixed(2)} TL`);
      console.log(`   Ortalama Maliyet: ${item.avgCost.toFixed(2)} TL/lot`);
      console.log(`   İlk Alış Fiyatı: ${item.purchasePrice} TL`);
    });

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCorrectedCostCalculation();