const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFatihAllTransactions() {
  try {
    // Fatih Çelebigil müşterisini bul
    const client = await prisma.client.findFirst({
      where: {
        fullName: 'Fatih Çelebigil'
      }
    });

    if (!client) {
      console.log('Fatih Çelebigil müşterisi bulunamadı');
      return;
    }

    console.log('Fatih Çelebigil müşterisi:', client.fullName, 'ID:', client.id);

    // Tüm işlemleri getir (BUY ve SELL)
    const transactions = await prisma.transaction.findMany({
      where: {
        clientId: client.id
      },
      include: {
        stock: true,
        broker: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log('\nToplam işlem sayısı:', transactions.length);
    console.log('\nTüm işlemler:');
    
    transactions.forEach((transaction, index) => {
      console.log(`${index + 1}. ${transaction.type} - ${transaction.stock.symbol} - ${transaction.lots} lot - ${transaction.price} TL - ${transaction.broker?.name || 'Broker yok'} - ${transaction.createdAt}`);
    });

    // Hisse bazında net lot hesapla
    const stockSummary = {};
    
    transactions.forEach(transaction => {
      const stockSymbol = transaction.stock.symbol;
      const brokerName = transaction.broker?.name || 'Broker yok';
      const key = `${stockSymbol}-${brokerName}`;
      
      if (!stockSummary[key]) {
        stockSummary[key] = {
          stock: stockSymbol,
          broker: brokerName,
          totalLots: 0,
          totalCost: 0,
          buyTransactions: 0,
          sellTransactions: 0
        };
      }
      
      if (transaction.type === 'BUY') {
        stockSummary[key].totalLots += transaction.lots;
        stockSummary[key].totalCost += (transaction.lots * transaction.price);
        stockSummary[key].buyTransactions++;
      } else if (transaction.type === 'SELL') {
        stockSummary[key].totalLots -= transaction.lots;
        stockSummary[key].totalCost -= (transaction.lots * transaction.price);
        stockSummary[key].sellTransactions++;
      }
    });

    console.log('\nHisse bazında net durum:');
    Object.values(stockSummary).forEach(summary => {
      console.log(`${summary.stock} (${summary.broker}): Net ${summary.totalLots} lot, Net Maliyet: ${summary.totalCost.toFixed(2)} TL, Alış: ${summary.buyTransactions}, Satış: ${summary.sellTransactions}`);
    });

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFatihAllTransactions();