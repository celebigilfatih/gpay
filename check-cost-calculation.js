import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCostCalculation() {
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

    console.log('Fatih Çelebigil maliyet hesaplama kontrolü:');
    console.log('==========================================');

    // Tüm işlemleri getir
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

    // Hisse ve broker bazında grupla
    const groups = {};
    
    transactions.forEach(transaction => {
      const key = `${transaction.stockId}-${transaction.brokerId || 'null'}`;
      if (!groups[key]) {
        groups[key] = {
          stock: transaction.stock,
          broker: transaction.broker,
          transactions: []
        };
      }
      groups[key].transactions.push(transaction);
    });

    Object.values(groups).forEach(group => {
      console.log(`\n${group.stock.symbol} (${group.broker?.name || 'Broker yok'}):`);
      console.log('İşlemler:');
      
      let totalCostManual = 0;
      let totalLotsManual = 0;
      
      group.transactions.forEach((t, index) => {
        const cost = t.lots * t.price;
        console.log(`  ${index + 1}. ${t.type}: ${t.lots} lot × ${t.price} TL = ${cost} TL`);
        
        if (t.type === 'BUY') {
          totalCostManual += cost;
          totalLotsManual += t.lots;
        } else {
          totalCostManual -= cost; // SELL işleminde maliyeti düşürüyoruz
          totalLotsManual -= t.lots;
        }
      });
      
      console.log(`Net Lot: ${totalLotsManual}`);
      console.log(`Net Maliyet: ${totalCostManual} TL`);
      
      // API mantığı ile karşılaştır
      const apiTotalLots = group.transactions.reduce((sum, t) => {
        return sum + (t.type === 'BUY' ? t.lots : -t.lots);
      }, 0);
      const apiTotalCost = group.transactions.reduce((sum, t) => {
        return sum + (t.type === 'BUY' ? (t.lots * t.price) : -(t.lots * t.price));
      }, 0);
      
      console.log(`API Lot: ${apiTotalLots} (${apiTotalLots === totalLotsManual ? '✓' : '✗'})`);
      console.log(`API Maliyet: ${apiTotalCost} TL (${apiTotalCost === totalCostManual ? '✓' : '✗'})`);
      
      // Ortalama maliyet hesapla (sadece kalan lotlar için)
      if (totalLotsManual > 0) {
        const avgCost = totalCostManual / totalLotsManual;
        console.log(`Ortalama Maliyet: ${avgCost.toFixed(2)} TL/lot`);
      } else if (totalLotsManual === 0) {
        console.log('Pozisyon kapalı - Net lot 0');
      } else {
        console.log('Negatif pozisyon - Short pozisyon');
      }
    });

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCostCalculation();
