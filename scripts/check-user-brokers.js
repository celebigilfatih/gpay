import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserBrokers() {
  try {
    const userBrokers = await prisma.userBroker.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
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
    
    console.log('UserBrokers:', userBrokers.length);
    userBrokers.forEach(ub => {
      console.log(`- ${ub.user.name} (${ub.user.email}) -> ${ub.broker.name} (${ub.broker.code})`);
    });
    
    // Specific user check
    const userId = 'c71a90ca-93ac-4add-b9d7-880f38ac0a97';
    const userSpecificBrokers = await prisma.userBroker.findMany({
      where: {
        userId: userId
      },
      include: {
        broker: true
      }
    });
    
    console.log(`\nUser ${userId} has ${userSpecificBrokers.length} brokers:`);
    userSpecificBrokers.forEach(ub => {
      console.log(`- ${ub.broker.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserBrokers();