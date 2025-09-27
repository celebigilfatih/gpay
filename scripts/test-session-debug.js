const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSessionDebug() {
  try {
    console.log('=== SESSION DEBUG TEST ===');
    
    // Tüm kullanıcıları listele
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    
    console.log('\n📋 Mevcut Kullanıcılar:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: ${user.role}`);
      console.log('');
    });
    
    // Test için bir kullanıcı seç
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`🧪 Test Kullanıcısı: ${testUser.email} (${testUser.name})`);
      
      // Bu kullanıcının müşterilerini kontrol et
      const clients = await prisma.client.findMany({
        where: {
          userId: testUser.id
        },
        select: {
          id: true,
          fullName: true,
          userId: true
        }
      });
      
      console.log(`\n👥 ${testUser.name} kullanıcısının müşterileri (${clients.length} adet):`);
      clients.forEach(client => {
        console.log(`- ${client.fullName} (ID: ${client.id})`);
      });
      
      if (clients.length > 0) {
        console.log(`\n🔍 İlk müşteri için silme testi yapılabilir: ${clients[0].fullName}`);
        console.log(`   Müşteri ID: ${clients[0].id}`);
        console.log(`   Kullanıcı ID: ${clients[0].userId}`);
        console.log(`   Test User ID: ${testUser.id}`);
        console.log(`   ID Eşleşmesi: ${clients[0].userId === testUser.id ? '✅' : '❌'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSessionDebug();