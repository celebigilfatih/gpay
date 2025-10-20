import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debugMeturVakif() {
  try {
    // Fatih Çelebigil'in client ID'si (önceki scriptlerden bilinen)
    const clientId = 'cm4rnqhqz0001uxqxqhqz0001';
    
    console.log(`Client ID: ${clientId}`);
    
    // Metur (Vakıf) işlemlerini al
    const transactions = await prisma.transaction.findMany({
      where: {
        clientId: clientId,
        stock: {
          symbol: 'Metur'
        },
        broker: {
          name: 'Vakıf'
        }
      },
      include: {
        stock: true,
        broker: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log('=== Metur (Vakıf) İşlemleri ===');
    transactions.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.type} - ${tx.lots} lot @ ${tx.price} TL - Tarih: ${tx.createdAt}`);
    });
    
    // Net lot hesapla
    let netLots = 0;
    transactions.forEach(tx => {
      if (tx.type === 'BUY') {
        netLots += tx.lots;
      } else if (tx.type === 'SELL') {
        netLots -= tx.lots;
      }
    });
    
    console.log(`\nNet Lot: ${netLots}`);
    
    // FIFO mantığıyla maliyet hesapla
    const buyTransactions = transactions
      .filter(t => t.type === 'BUY')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    console.log('\n=== BUY İşlemleri (Kronolojik) ===');
    buyTransactions.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.lots} lot @ ${tx.price} TL - Tarih: ${tx.createdAt}`);
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
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMeturVakif();
