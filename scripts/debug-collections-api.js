import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugCollectionsAPI() {
  try {
    console.log('=== Collections API Debug ===\n');

    // 1. Barış Manço kullanıcısını bul
    const barisUser = await prisma.user.findFirst({
      where: {
        name: 'Barış Manço'
      }
    });

    if (!barisUser) {
      console.log('❌ Barış Manço kullanıcısı bulunamadı!');
      return;
    }

    console.log('✅ Barış Manço kullanıcısı bulundu:');
    console.log(`   ID: ${barisUser.id}`);
    console.log(`   Email: ${barisUser.email}`);
    console.log('');

    // 2. Bu kullanıcının müşterilerini bul
    const clients = await prisma.client.findMany({
      where: {
        userId: barisUser.id
      },
      include: {
        transactions: {
          where: {
            commission: {
              not: null
            }
          }
        }
      }
    });

    console.log(`📋 Barış Manço'nun müşteri sayısı: ${clients.length}`);
    
    clients.forEach((client, index) => {
      console.log(`\n${index + 1}. Müşteri: ${client.fullName}`);
      console.log(`   ID: ${client.id}`);
      console.log(`   Komisyonlu işlem sayısı: ${client.transactions.length}`);
      
      if (client.transactions.length > 0) {
        const totalCommission = client.transactions.reduce((sum, t) => sum + (t.commission || 0), 0);
        console.log(`   Toplam komisyon: ${totalCommission} TL`);
      }
    });

    // 3. Collections API mantığını simüle et
    console.log('\n=== Collections API Simülasyonu ===');
    
    const collectionsData = [];
    
    for (const client of clients) {
      const transactions = await prisma.transaction.findMany({
        where: {
          clientId: client.id,
          commission: {
            not: null
          }
        }
      });

      if (transactions.length === 0) {
        console.log(`⚠️  ${client.fullName}: Komisyonlu işlem yok, listeye eklenmeyecek`);
        continue;
      }

      const totalCommission = transactions.reduce((sum, t) => sum + (t.commission || 0), 0);
      const positiveCommission = transactions
        .filter(t => (t.commission || 0) > 0)
        .reduce((sum, t) => sum + (t.commission || 0), 0);
      const negativeCommission = transactions
        .filter(t => (t.commission || 0) < 0)
        .reduce((sum, t) => sum + Math.abs(t.commission || 0), 0);

      // Ödemeleri kontrol et
      const payments = await prisma.payment.findMany({
        where: {
          clientId: client.id
        }
      });

      const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
      const remainingBalance = totalCommission - totalPayments;

      const collectionData = {
        clientId: client.id,
        clientName: client.fullName,
        clientPhone: client.phoneNumber,
        totalCommission,
        positiveCommission,
        negativeCommission,
        transactionCount: transactions.length,
        totalPayments,
        remainingBalance
      };

      collectionsData.push(collectionData);
      
      console.log(`✅ ${client.fullName}: Listeye eklendi`);
      console.log(`   Toplam komisyon: ${totalCommission} TL`);
      console.log(`   Kalan bakiye: ${remainingBalance} TL`);
    }

    console.log(`\n📊 Collections listesinde toplam ${collectionsData.length} müşteri olmalı`);

    // 4. Gerçek API çağrısını test et
    console.log('\n=== Gerçek API Test ===');
    try {
      const response = await fetch('http://localhost:3001/api/collections');
      const apiData = await response.json();
      
      console.log('API Response:', JSON.stringify(apiData, null, 2));
      
      if (Array.isArray(apiData)) {
        console.log(`API'den dönen müşteri sayısı: ${apiData.length}`);
        
        const barisInAPI = apiData.find(item => item.clientName === 'Barış Manço');
        if (barisInAPI) {
          console.log('✅ Barış Manço API\'de bulundu!');
          console.log(`   Komisyon: ${barisInAPI.totalCommission} TL`);
        } else {
          console.log('❌ Barış Manço API\'de bulunamadı!');
          console.log('API\'deki müşteriler:');
          apiData.forEach(item => {
            console.log(`   - ${item.clientName}`);
          });
        }
      } else {
        console.log('❌ API response array değil:', typeof apiData);
      }
    } catch (error) {
      console.log('❌ API çağrısı başarısız:', error.message);
    }

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCollectionsAPI();
