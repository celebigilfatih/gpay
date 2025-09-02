import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createBarisUser() {
  try {
    console.log('Barış Manço kullanıcısını oluşturuyor...');
    
    // Önce kullanıcının var olup olmadığını kontrol et
    const existingUser = await prisma.user.findUnique({
      where: { email: 'barismanço@example.com' }
    });
    
    let user;
    if (existingUser) {
      console.log('Barış Manço kullanıcısı zaten mevcut:', existingUser.id);
      user = existingUser;
    } else {
      // Şifreyi hash'le
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Kullanıcıyı oluştur
      user = await prisma.user.create({
        data: {
          email: 'barismanço@example.com',
          name: 'Barış Manço',
          password: hashedPassword,
          role: 'USER'
        }
      });
      
      console.log('Barış Manço kullanıcısı oluşturuldu:', user.id);
    }
    
    // İlk birkaç aracı kurumu al (Garanti BBVA ve İş Bankası)
    const brokers = await prisma.broker.findMany({
      where: {
        OR: [
          { name: 'Garanti BBVA Yatırım Menkul Kıymetler A.Ş.' },
          { name: 'Türkiye İş Bankası A.Ş.' }
        ]
      }
    });
    
    console.log('Bulunan aracı kurumlar:', brokers.map(b => b.name));
    
    // UserBroker ilişkilerini oluştur
    for (const broker of brokers) {
      const existingUserBroker = await prisma.userBroker.findUnique({
        where: {
          userId_brokerId: {
            userId: user.id,
            brokerId: broker.id
          }
        }
      });
      
      if (!existingUserBroker) {
        await prisma.userBroker.create({
          data: {
            userId: user.id,
            brokerId: broker.id
          }
        });
        console.log(`${broker.name} aracı kurumu Barış Manço'ya eklendi`);
      } else {
        console.log(`${broker.name} aracı kurumu zaten kayıtlı`);
      }
    }
    
    console.log('İşlem tamamlandı!');
    return user;
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBarisUser();