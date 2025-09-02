const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndFixClientBrokers() {
  try {
    const clientId = '3d2ca00f-090f-4211-8a5c-68305720bd7f';
    const userId = 'c71a90ca-93ac-4add-b9d7-880f38ac0a97';
    
    // Check if client exists
    let client = await prisma.client.findUnique({
      where: { id: clientId }
    });
    
    if (!client) {
      console.log('Client not found, creating test client...');
      client = await prisma.client.create({
        data: {
          id: clientId,
          fullName: 'Test Client',
          phoneNumber: '5551234567',
          brokerageFirm: 'Test Firm',
          city: 'Test City',
          userId: userId
        }
      });
      console.log('Test client created:', client.fullName);
    }
    
    // Check current client-broker relationships
    const currentRelations = await prisma.clientBroker.findMany({
      where: { clientId },
      include: { broker: true }
    });
    
    console.log('Current client-broker relationships:', JSON.stringify(currentRelations, null, 2));
    
    if (currentRelations.length === 0) {
      console.log('No broker relationships found, creating them...');
      
      // Create test brokers if they don't exist
      const brokers = await Promise.all([
        prisma.broker.upsert({
          where: { id: '550e8400-e29b-41d4-a716-446655440001' },
          update: {},
          create: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Test Broker 1',
            code: 'TB001',
            isActive: true
          }
        }),
        prisma.broker.upsert({
          where: { id: '550e8400-e29b-41d4-a716-446655440002' },
          update: {},
          create: {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Test Broker 2',
            code: 'TB002',
            isActive: true
          }
        }),
        prisma.broker.upsert({
          where: { id: '550e8400-e29b-41d4-a716-446655440003' },
          update: {},
          create: {
            id: '550e8400-e29b-41d4-a716-446655440003',
            name: 'Test Broker 3',
            code: 'TB003',
            isActive: true
          }
        })
      ]);
      
      console.log('Brokers created:', brokers.map(b => b.name));
      
      // Create client-broker relationships
      const clientBrokerRelations = await Promise.all([
        prisma.clientBroker.create({
          data: {
            clientId,
            brokerId: '550e8400-e29b-41d4-a716-446655440001'
          }
        }),
        prisma.clientBroker.create({
          data: {
            clientId,
            brokerId: '550e8400-e29b-41d4-a716-446655440002'
          }
        }),
        prisma.clientBroker.create({
          data: {
            clientId,
            brokerId: '550e8400-e29b-41d4-a716-446655440003'
          }
        })
      ]);
      
      console.log('Client-broker relationships created:', clientBrokerRelations.length);
    }
    
    // Verify the relationships
    const updatedRelations = await prisma.clientBroker.findMany({
      where: { clientId },
      include: { broker: true }
    });
    
    console.log('Updated client-broker relationships:', JSON.stringify(updatedRelations, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixClientBrokers();