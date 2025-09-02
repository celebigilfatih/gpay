const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function createTestClientWithBrokers() {
  try {
    // Find the test user
    const user = await prisma.user.findFirst({
      where: { email: 'fatihcelebigil@gmail.com' }
    });

    if (!user) {
      console.log('Test user not found');
      return;
    }

    // Get some brokers for this user
    const userBrokers = await prisma.userBroker.findMany({
      where: { userId: user.id },
      include: { broker: true },
      take: 3
    });

    if (userBrokers.length === 0) {
      console.log('No brokers found for user');
      return;
    }

    const brokerIds = userBrokers.map(ub => ub.brokerId);
    
    console.log('Creating test client with brokers:', brokerIds);

    // Create client via API simulation
    const client = await prisma.client.create({
      data: {
        fullName: 'Test Client With Brokers',
        phoneNumber: '5551234567',
        brokerageFirm: userBrokers.map(ub => ub.broker.name).join(', '),
        city: 'İstanbul',
        userId: user.id,
      },
    });

    console.log('Client created:', client.id);

    // Create ClientBroker relationships
    await prisma.clientBroker.createMany({
      data: brokerIds.map(brokerId => ({
        clientId: client.id,
        brokerId: brokerId,
        isActive: true,
      })),
    });

    console.log('ClientBroker relationships created');

    // Verify the client has brokers
    const clientWithBrokers = await prisma.client.findUnique({
      where: { id: client.id },
      include: {
        brokers: {
          include: { broker: true }
        }
      }
    });

    console.log('Client with brokers:', {
      name: clientWithBrokers.fullName,
      brokerCount: clientWithBrokers.brokers.length,
      brokers: clientWithBrokers.brokers.map(b => b.broker.name)
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestClientWithBrokers();