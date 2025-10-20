import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBarisUser() {
  try {
    console.log('Barış Manço müşterisini doğru kullanıcıya bağlıyorum...');
    
    // Barış Manço kullanıcısını bul
    const barisUser = await prisma.user.findUnique({
      where: { email: 'barismanço@example.com' }
    });
    
    if (!barisUser) {
      console.log('❌ Barış Manço kullanıcısı bulunamadı!');
      return;
    }
    
    console.log('✅ Barış Manço kullanıcısı bulundu:', barisUser.id);
    
    // Barış Manço müşterisini bul
    const barisClient = await prisma.client.findFirst({
      where: {
        fullName: 'Barış Manço'
      }
    });
    
    if (!barisClient) {
      console.log('❌ Barış Manço müşterisi bulunamadı!');
      return;
    }
    
    console.log('✅ Barış Manço müşterisi bulundu:', barisClient.id);
    console.log('   Şu anki kullanıcı ID:', barisClient.userId);
    
    if (barisClient.userId === barisUser.id) {
      console.log('✅ Barış Manço müşterisi zaten doğru kullanıcıya bağlı!');
      return;
    }
    
    // Müşteriyi doğru kullanıcıya bağla
    const updatedClient = await prisma.client.update({
      where: { id: barisClient.id },
      data: { userId: barisUser.id }
    });
    
    console.log('✅ Barış Manço müşterisi başarıyla güncellendi!');
    console.log('   Yeni kullanıcı ID:', updatedClient.userId);
    
    // İşlemleri de güncelle (eğer gerekiyorsa)
    const transactions = await prisma.transaction.findMany({
      where: { clientId: barisClient.id }
    });
    
    console.log(`Barış Manço'nun ${transactions.length} işlemi var.`);
    
    // Ödemeleri de güncelle (eğer varsa)
    const payments = await prisma.payment.findMany({
      where: { clientId: barisClient.id }
    });
    
    if (payments.length > 0) {
      await prisma.payment.updateMany({
        where: { clientId: barisClient.id },
        data: { userId: barisUser.id }
      });
      console.log(`${payments.length} ödeme kaydı da güncellendi.`);
    }
    
    console.log('\n🎉 Barış Manço artık Collections listesinde görünecek!');
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBarisUser();
