const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPurchasesAPI() {
  try {
    // Fatih Çelebigil'in user ID'si
    const userId = 'cm4rnqhqz0000uxqxqhqz0000';
    
    // API mantığını simüle et
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

    console.log('\n=== GÜNCELLENMIŞ API SONUÇLARI (TÜM ALIŞLAR) ===');
    
    for (const group of Object.values(groupedTransactions)) {
      // Stock, client ve broker bilgilerini al
      const stock = await prisma.stock.findUnique({ where: { id: group.stockId } });
      const client = await prisma.client.findUnique({ where: { id: group.clientId } });
      const broker = group.brokerId ? await prisma.broker.findUnique({ where: { id: group.brokerId } }) : null;
      
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
      
      console.log(`\n${stock?.symbol} (${broker?.name || 'Bilinmeyen'}) - ${client?.fullName}`);
      console.log(`Net Lot: ${totalLots}`);
      console.log('Alış İşlemleri:');
      purchases.forEach((purchase, index) => {
        console.log(`  ${index + 1}. ${purchase.lots} lot @ ${purchase.price} TL = ${purchase.totalCost} TL`);
      });
      
      const totalPurchaseCost = purchases.reduce((sum, p) => sum + p.totalCost, 0);
      const totalPurchaseLots = purchases.reduce((sum, p) => sum + p.lots, 0);
      console.log(`Toplam Alış: ${totalPurchaseLots} lot - ${totalPurchaseCost} TL`);
    }
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPurchasesAPI();