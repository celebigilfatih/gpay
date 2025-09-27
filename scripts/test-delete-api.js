const { PrismaClient } = require('@prisma/client');
const { getServerSession } = require('next-auth/next');

const prisma = new PrismaClient();

async function testDeleteAPI() {
  try {
    console.log('=== DELETE API TEST ===');
    
    // Test için bir müşteri seç
    const testClient = await prisma.client.findFirst({
      where: {
        userId: 'c71a90ca-93ac-4add-b9d7-880f38ac0a97' // Fatih'in ID'si
      }
    });
    
    if (!testClient) {
      console.log('❌ Test için müşteri bulunamadı');
      return;
    }
    
    console.log(`🧪 Test Müşterisi: ${testClient.fullName}`);
    console.log(`   Müşteri ID: ${testClient.id}`);
    console.log(`   Kullanıcı ID: ${testClient.userId}`);
    
    // Simüle edilmiş session objesi
    const mockSession = {
      user: {
        id: 'c71a90ca-93ac-4add-b9d7-880f38ac0a97',
        email: 'fatihcelebigil@gmail.com',
        name: 'Fatih Çelebigil',
        role: 'USER'
      }
    };
    
    console.log('\n🔐 Mock Session:');
    console.log('   Session User ID:', mockSession.user.id);
    console.log('   Client User ID:', testClient.userId);
    console.log('   ID Match:', mockSession.user.id === testClient.userId ? '✅' : '❌');
    
    // Authorization kontrolü simülasyonu
    if (!mockSession || !mockSession.user) {
      console.log('❌ Session yok - 401 Unauthorized');
      return;
    }
    
    if (testClient.userId !== mockSession.user.id) {
      console.log('❌ Müşteri kullanıcıya ait değil - 401 Unauthorized');
      return;
    }
    
    console.log('✅ Authorization başarılı - Silme işlemi yapılabilir');
    
    // Gerçek silme işlemi yapmıyoruz, sadece test ediyoruz
    console.log('\n⚠️  Gerçek silme işlemi yapılmadı (test modu)');
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteAPI();