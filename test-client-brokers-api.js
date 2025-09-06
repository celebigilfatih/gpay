const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testClientBrokersAPI() {
  try {
    console.log('=== CLIENT BROKERS API TEST ===');
    
    // Bir müşteri seç
    const client = await prisma.client.findFirst({
      include: {
        user: { select: { name: true, email: true } }
      }
    });
    
    if (!client) {
      console.log('❌ Hiç müşteri bulunamadı!');
      return;
    }
    
    console.log(`Test edilecek müşteri: ${client.fullName} (ID: ${client.id})`);
    
    // API endpoint'ini simüle et
    const clientBrokers = await prisma.clientBroker.findMany({
      where: {
        clientId: client.id
      },
      include: {
        broker: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });
    
    console.log(`\nBu müşterinin aracı kurum sayısı: ${clientBrokers.length}`);
    
    if (clientBrokers.length === 0) {
      console.log('❌ Bu müşterinin aracı kurumu yok!');
    } else {
      console.log('✅ Bu müşterinin aracı kurumları:');
      clientBrokers.forEach((cb, index) => {
        console.log(`${index + 1}. ${cb.broker.name} (${cb.broker.code}) - ID: ${cb.broker.id}`);
      });
      
      // API response formatında göster
      const apiResponse = clientBrokers.map(cb => ({
        id: cb.broker.id,
        name: cb.broker.name,
        code: cb.broker.code
      }));
      
      console.log('\n=== API RESPONSE FORMAT ===');
      console.log(JSON.stringify(apiResponse, null, 2));
    }
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testClientBrokersAPI();