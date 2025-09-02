import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addBarisManco() {
  try {
    // Check if Barış Manço already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        name: 'Barış Manço'
      }
    });

    if (existingUser) {
      console.log('Barış Manço kullanıcısı zaten mevcut:', existingUser);
      return existingUser;
    }

    // Create Barış Manço user
    const barisManco = await prisma.user.create({
      data: {
        email: 'barismanco@example.com',
        name: 'Barış Manço'
      }
    });

    console.log('Barış Manço kullanıcısı eklendi:', barisManco);
    return barisManco;
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addBarisManco();