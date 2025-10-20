import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function debugClientCollections() {
  const clientId = '8b509208-0fe2-43c6-a815-7c08c0b89caf';
  
  console.log('🔍 Client Collections Debug');
  console.log('==========================');
  
  try {
    // 1. Client bilgilerini al
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: true
      }
    });
    
    if (!client) {
      console.log('❌ Client bulunamadı!');
      return;
    }
    
    console.log('👤 Client Bilgileri:');
    console.log(`   ID: ${client.id}`);
    console.log(`   İsim: ${client.fullName || client.name || 'N/A'}`);
    console.log(`   Telefon: ${client.phoneNumber || 'N/A'}`);
    console.log(`   User: ${client.user?.name || 'N/A'}`);
    console.log('');
    
    // 2. Transactions (İşlemler)
    const transactions = await prisma.transaction.findMany({
      where: { clientId: clientId },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('📊 Transactions (İşlemler):');
    console.log(`   Toplam: ${transactions.length} işlem`);
    
    let totalTransactionAmount = 0;
    transactions.forEach((tx, index) => {
      const calculatedAmount = (tx.lots || 0) * (tx.price || 0);
      console.log(`   ${index + 1}. ${tx.type}: ${calculatedAmount} TL (${tx.createdAt.toISOString().split('T')[0]})`);
      console.log(`      Detay: lots=${tx.lots}, price=${tx.price}, commission=${tx.commission}`);
      console.log(`      ID: ${tx.id}`);
      
      totalTransactionAmount += calculatedAmount;
    });
    console.log(`   Toplam İşlem Tutarı: ${totalTransactionAmount} TL`);
    console.log('');
    
    // 3. Payments (Ödemeler)
    const payments = await prisma.payment.findMany({
      where: { clientId: clientId },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('💰 Payments (Ödemeler):');
    console.log(`   Toplam: ${payments.length} ödeme`);
    
    let totalPaymentAmount = 0;
    payments.forEach((payment, index) => {
      console.log(`   ${index + 1}. ${payment.amount} TL - ${payment.description || 'Açıklama yok'} (${payment.createdAt.toISOString().split('T')[0]})`);
      totalPaymentAmount += parseFloat(payment.amount);
    });
    console.log(`   Toplam Ödeme Tutarı: ${totalPaymentAmount} TL`);
    console.log('');
    
    // 4. Commissions (Komisyonlar)
    const commissions = await prisma.transaction.findMany({
      where: { 
        clientId: clientId,
        commission: { gt: 0 }
      }
    });
    
    console.log('💼 Commissions (Komisyonlar):');
    console.log(`   Komisyonlu İşlem Sayısı: ${commissions.length}`);
    
    let totalCommission = 0;
    commissions.forEach((tx, index) => {
      console.log(`   ${index + 1}. İşlem: ${tx.amount} TL, Komisyon: ${tx.commission} TL`);
      totalCommission += parseFloat(tx.commission || 0);
    });
    console.log(`   Toplam Komisyon: ${totalCommission} TL`);
    console.log('');
    
    // 5. Tahsilat Hesaplaması
    console.log('📈 Tahsilat Hesaplaması:');
    console.log(`   Toplam İşlemler: ${totalTransactionAmount} TL`);
    console.log(`   Toplam Ödemeler: ${totalPaymentAmount} TL`);
    console.log(`   Toplam Komisyon: ${totalCommission} TL`);
    
    const collectionAmount = totalTransactionAmount + totalCommission - totalPaymentAmount;
    console.log(`   Tahsilat Durumu: ${collectionAmount} TL`);
    
    if (collectionAmount < 0) {
      console.log('   ⚠️  NEGATİF TAHSILAT DURUMU TESPİT EDİLDİ!');
    }
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugClientCollections();
