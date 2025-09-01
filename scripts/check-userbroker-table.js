import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserBrokerTable() {
  try {
    console.log('UserBroker tablosundaki tüm kayıtlar:');
    
    const userBrokers = await prisma.userBroker.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        broker: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });
    
    console.log(`Toplam UserBroker kayıt sayısı: ${userBrokers.length}`);
    console.log('\nDetaylar:');
    
    userBrokers.forEach((ub, index) => {
      console.log(`${index + 1}. ${ub.user.name} (${ub.user.email}) -> ${ub.broker.name} (${ub.broker.code})`);
    });
    
    // Fatih Çelebigil'e özel kontrol
    const fatihBrokers = userBrokers.filter(ub => 
      ub.user.email === 'fatihcelebigil@gmail.com'
    );
    
    console.log(`\nFatih Çelebigil'in broker sayısı: ${fatihBrokers.length}`);
    fatihBrokers.forEach((ub, index) => {
      console.log(`${index + 1}. ${ub.broker.name} (${ub.broker.code})`);
    });
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserBrokerTable();