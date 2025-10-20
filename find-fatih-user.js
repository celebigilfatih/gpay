import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findFatihUser() {
  try {
    // Fatih Çelebigil müşterisini bul
    const client = await prisma.client.findFirst({
      where: {
        fullName: 'Fatih Çelebigil'
      },
      include: {
        user: true
      }
    });

    if (!client) {
      console.log('Fatih Çelebigil müşterisi bulunamadı');
      return;
    }

    console.log('Fatih Çelebigil müşterisi bulundu:');
    console.log('Client ID:', client.id);
    console.log('User ID:', client.userId);
    console.log('User Email:', client.user?.email || 'Email yok');
    console.log('User Name:', client.user?.name || 'Name yok');

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findFatihUser();
