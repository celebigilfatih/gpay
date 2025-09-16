const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFinalPurchases() {
  try {
    // Fatih Çelebigil'in user ID'si
    const userId = 'c71a90ca-93ac-4add-b9d7-880f38ac0a97';
    
    console.log('=== GÜNCELLENMIŞ API TEST (TÜM ALIŞLAR) ===\n');
    
    // API mantığını tam olarak simüle et
    const transactions = await prisma.transaction.findMany({
      where: {
        client: {
          userId: userId
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

    console.log(`Toplam ${transactions.length} işlem bulundu.`);

    // Transaction'ları grupla
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

    // Her grup için detaylı bilgileri getir (güncellenmiş API mantığı)
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

        // Net lot hesapla
        const totalLots = group.transactions.reduce((sum, t) => {
          return sum + (t.type === 'BUY' ? t.lots : -t.lots);
        }, 0);
        
        // Tüm alış işlemlerini al ve sırala
        const buyTransactions = group.transactions
          .filter(t => t.type === 'BUY')
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // Her alış işlemini ayrı ayrı döndür
        const purchases = buyTransactions.map(buyTx => ({
          lots: buyTx.lots,
          price: buyTx.price,
          totalCost: buyTx.lots * buyTx.price
        }));
        
        // İlk alış fiyatını kullan
        const purchasePrice = buyTransactions.length > 0 ? buyTransactions[0].price : 0;

        return {
          stockId: group.stockId,
          stock: stock,
          client: client,
          broker: broker,
          totalLots: totalLots,
          purchasePrice: purchasePrice,
          purchases: purchases
        };
      })
    );

    // Hisse bazında grupla
    const groupedByStock = detailedStockCosts.reduce((acc, item) => {
      const stockKey = item.stockId;
      if (!acc[stockKey]) {
        acc[stockKey] = {
          stock: item.stock,
          clients: []
        };
      }
      acc[stockKey].clients.push({
        client: item.client,
        broker: item.broker,
        totalLots: item.totalLots,
        purchasePrice: item.purchasePrice,
        purchases: item.purchases
      });
      return acc;
    }, {});

    // Sonuçları göster
    const result = Object.values(groupedByStock);
    
    console.log('\n=== FRONTEND\'DE GÖSTERILECEK VERİ ===');
    
    result.forEach((stockGroup, stockIndex) => {
      console.log(`\n${stockIndex + 1}. HİSSE: ${stockGroup.stock?.symbol} (${stockGroup.stock?.name})`);
      
      stockGroup.clients.forEach((clientCost, clientIndex) => {
        console.log(`\n  MÜŞTERİ ${clientIndex + 1}: ${clientCost.client?.fullName}`);
        console.log(`  Broker: ${clientCost.broker?.name || 'Bilinmeyen'}`);
        console.log(`  Net Lot: ${clientCost.totalLots}`);
        console.log(`  Alış İşlemleri:`);
        
        clientCost.purchases.forEach((purchase, purchaseIndex) => {
          console.log(`    ${purchaseIndex + 1}. ${purchase.lots} lot @ ${purchase.price} TL = ${purchase.totalCost} TL`);
        });
        
        const totalPurchaseCost = clientCost.purchases.reduce((sum, p) => sum + p.totalCost, 0);
        const totalPurchaseLots = clientCost.purchases.reduce((sum, p) => sum + p.lots, 0);
        console.log(`  Toplam Alış: ${totalPurchaseLots} lot - ${totalPurchaseCost} TL`);
      });
    });
    
    console.log('\n=== TABLO SATIRLARI ===');
    result.forEach((stockGroup) => {
      console.log(`\nHİSSE: ${stockGroup.stock?.symbol}`);
      stockGroup.clients.forEach((clientCost) => {
        clientCost.purchases.forEach((purchase, purchaseIndex) => {
          console.log(`  Satır ${purchaseIndex + 1}: ${purchaseIndex === 0 ? clientCost.client?.fullName : ''} | ${purchaseIndex === 0 ? (clientCost.broker?.name || '-') : ''} | ${purchase.lots} lot | ${purchase.price} TL | ${purchase.totalCost} TL | ${purchaseIndex === 0 ? clientCost.totalLots + ' net' : ''}`);
        });
      });
    });
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFinalPurchases();