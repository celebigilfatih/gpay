import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testStockCostsAPI() {
  try {
    const fatihUserId = 'c71a90ca-93ac-4add-b9d7-880f38ac0a97';
    
    console.log('Stock Costs API mantığını test ediyorum...');
    
    // API'deki mantığı simüle et
    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'BUY',
        client: {
          userId: fatihUserId
        }
      },
      select: {
        stockId: true,
        clientId: true,
        brokerId: true,
        lots: true,
        price: true
      }
    });
    
    console.log(`Toplam BUY transaction sayısı: ${transactions.length}`);
    
    // Transaction'ları manuel olarak grupla (API'deki mantık)
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
    
    console.log(`Gruplandırılmış transaction sayısı: ${Object.keys(groupedTransactions).length}`);
    
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

        // Toplam lot ve maliyet hesapla
        const totalLots = group.transactions.reduce((sum, t) => sum + t.lots, 0);
        const totalCost = group.transactions.reduce((sum, t) => sum + (t.lots * t.price), 0);
        // İlk alış fiyatını kullan
        const purchasePrice = group.transactions[0].price;

        return {
          stockId: group.stockId,
          stock: stock,
          client: client,
          broker: broker,
          totalLots: totalLots,
          purchasePrice: purchasePrice,
          totalCost: totalCost,
          transactions: group.transactions
        };
      })
    );
    
    console.log('\n=== API SONUÇLARI ===');
    
    // Fatih Çelebigil müşterisine odaklan
    const fatihResults = detailedStockCosts.filter(item => item.client?.fullName === 'Fatih Çelebigil');
    
    console.log(`Fatih Çelebigil için bulunan grup sayısı: ${fatihResults.length}`);
    
    fatihResults.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.stock?.symbol || 'N/A'}`);
      console.log(`   Müşteri: ${item.client?.fullName}`);
      console.log(`   Broker: ${item.broker?.name || 'N/A'}`);
      console.log(`   Toplam Lot: ${item.totalLots}`);
      console.log(`   İlk Alış Fiyatı: ${item.purchasePrice}`);
      console.log(`   Toplam Maliyet: ${item.totalCost}`);
      console.log(`   Transaction Sayısı: ${item.transactions.length}`);
      
      // Transaction detayları
      console.log('   Transaction Detayları:');
      item.transactions.forEach((t, tIndex) => {
        console.log(`     ${tIndex + 1}. Lot: ${t.lots}, Fiyat: ${t.price}, Toplam: ${t.lots * t.price}`);
      });
    });
    
    // Hisse bazında grupla (API'nin son adımı)
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
        totalCost: item.totalCost
      });
      return acc;
    }, {});
    
    console.log('\n=== HİSSE BAZINDA GRUPLAMA ===');
    Object.values(groupedByStock).forEach((stockGroup, index) => {
      console.log(`\n${index + 1}. ${stockGroup.stock?.symbol || 'N/A'}`);
      stockGroup.clients.forEach((clientCost, clientIndex) => {
        if (clientCost.client?.fullName === 'Fatih Çelebigil') {
          console.log(`   ${clientIndex + 1}. ${clientCost.client?.fullName}`);
          console.log(`      Broker: ${clientCost.broker?.name || 'N/A'}`);
          console.log(`      Lot: ${clientCost.totalLots}`);
          console.log(`      Alış Fiyatı: ${clientCost.purchasePrice}`);
          console.log(`      Toplam: ${clientCost.totalCost}`);
        }
      });
    });
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStockCostsAPI();