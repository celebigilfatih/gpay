const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMeturVakifDetailed() {
  try {
    // Fatih Çelebigil'in user ID'si
    const userId = 'cm4rnqhqz0000uxqxqhqz0000';
    
    // Tüm işlemleri al ve grupla
    const transactions = await prisma.transaction.findMany({
      where: {
        client: {
          userId: userId
        }
      },
      include: {
        stock: true,
        broker: true,
        client: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`Toplam ${transactions.length} işlem bulundu.`);
    
    // Metur + Vakıf kombinasyonunu bul
    const meturVakifTransactions = transactions.filter(t => 
      t.stock.symbol === 'Metur' && t.broker.name === 'Vakıf Yatırım Menkul Değerler A.Ş.'
    );
    
    console.log('\n=== Metur (Vakıf) İşlemleri ===');
    meturVakifTransactions.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.type} - ${tx.lots} lot @ ${tx.price} TL - ${tx.createdAt}`);
    });
    
    // Net lot hesapla
    let netLots = 0;
    meturVakifTransactions.forEach(tx => {
      if (tx.type === 'BUY') {
        netLots += tx.lots;
      } else if (tx.type === 'SELL') {
        netLots -= tx.lots;
      }
    });
    
    console.log(`\nNet Lot: ${netLots}`);
    
    // FIFO mantığıyla maliyet hesapla
    const buyTransactions = meturVakifTransactions
      .filter(t => t.type === 'BUY')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    console.log('\n=== BUY İşlemleri (Kronolojik) ===');
    buyTransactions.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.lots} lot @ ${tx.price} TL - ${tx.createdAt}`);
    });
    
    let remainingLots = netLots;
    let totalCost = 0;
    
    console.log(`\n=== FIFO Maliyet Hesaplama ===`);
    console.log(`Hesaplanacak lot sayısı: ${remainingLots}`);
    
    if (remainingLots > 0) {
      let lotsToCalculate = remainingLots;
      
      for (const buyTx of buyTransactions) {
        if (lotsToCalculate <= 0) break;
        
        const lotsFromThisTx = Math.min(lotsToCalculate, buyTx.lots);
        const costFromThisTx = lotsFromThisTx * buyTx.price;
        
        console.log(`- ${lotsFromThisTx} lot @ ${buyTx.price} TL = ${costFromThisTx} TL`);
        
        totalCost += costFromThisTx;
        lotsToCalculate -= lotsFromThisTx;
      }
    }
    
    const averageCost = netLots > 0 ? totalCost / netLots : 0;
    
    console.log(`\n=== SONUÇ ===`);
    console.log(`Net Lot: ${netLots}`);
    console.log(`Toplam Maliyet: ${totalCost} TL`);
    console.log(`Ortalama Maliyet: ${averageCost.toFixed(2)} TL/lot`);
    
    // Tüm broker isimlerini listele
    console.log('\n=== Tüm Broker İsimleri ===');
    const uniqueBrokers = [...new Set(transactions.map(t => t.broker?.name).filter(Boolean))];
    uniqueBrokers.forEach(broker => console.log(`- ${broker}`));
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMeturVakifDetailed();