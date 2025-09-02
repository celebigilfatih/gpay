const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyClientCreationWithBrokers() {
  try {
    console.log('=== Client Creation with Brokers Verification ===');
    
    // Get test user
    const user = await prisma.user.findFirst({
      where: { email: 'fatihcelebigil@gmail.com' }
    });

    if (!user) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('✅ Test user found:', user.email);

    // Get some brokers for this user
    const userBrokers = await prisma.userBroker.findMany({
      where: { userId: user.id },
      include: { broker: true },
      take: 3
    });

    if (userBrokers.length === 0) {
      console.log('❌ No brokers found for user');
      return;
    }

    const brokerIds = userBrokers.map(ub => ub.brokerId);
    console.log('✅ Found brokers:', userBrokers.map(ub => ub.broker.name));

    // Test the API logic
    console.log('\n📋 Testing client creation with brokers...');

    // Create client (simulating API call)
    const client = await prisma.client.create({
      data: {
        fullName: 'Test API Client',
        phoneNumber: '5559876543',
        brokerageFirm: userBrokers.map(ub => ub.broker.name).join(', '),
        city: 'Ankara',
        userId: user.id,
      },
    });

    console.log('✅ Client created:', client.id);

    // Create ClientBroker relationships (simulating API logic)
    const clientBrokerData = brokerIds.map(brokerId => ({
      clientId: client.id,
      brokerId: brokerId,
      isActive: true,
    }));

    await prisma.clientBroker.createMany({
      data: clientBrokerData,
    });

    console.log('✅ ClientBroker relationships created');

    // Verify the client has brokers
    const clientWithBrokers = await prisma.client.findUnique({
      where: { id: client.id },
      include: {
        brokers: {
          include: { broker: true }
        }
      }
    });

    console.log('\n✅ Verification Results:');
    console.log('Client:', clientWithBrokers.fullName);
    console.log('Broker Count:', clientWithBrokers.brokers.length);
    console.log('Brokers:', clientWithBrokers.brokers.map(b => b.broker.name));

    if (clientWithBrokers.brokers.length === brokerIds.length) {
      console.log('✅ SUCCESS: All brokers correctly assigned to client');
    } else {
      console.log('❌ FAILURE: Brokers not correctly assigned');
    }

    // Clean up test client
    await prisma.clientBroker.deleteMany({
      where: { clientId: client.id }
    });
    await prisma.client.delete({
      where: { id: client.id }
    });

    console.log('✅ Test cleanup completed');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyClientCreationWithBrokers();