const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createCompleteTestData() {
  try {
    // Test kullanıcısı
    const user = await prisma.user.upsert({
      where: { id: 'c71a90ca-93ac-4add-b9d7-880f38ac0a97' },
      update: {},
      create: {
        id: 'c71a90ca-93ac-4add-b9d7-880f38ac0a97',
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      }
    });

    // Test client
    const client = await prisma.client.upsert({
      where: { id: '3d2ca00f-090f-4211-8a5c-68305720bd7f' },
      update: {
        userId: user.id
      },
      create: {
        id: '3d2ca00f-090f-4211-8a5c-68305720bd7f',
        fullName: 'Test Client',
        phoneNumber: '+1234567890',
        brokerageFirm: 'Test Brokerage',
        city: 'Test City',
        userId: user.id
      }
    });

    // Test brokerlar
    const brokers = await Promise.all([
      prisma.broker.upsert({
        where: { id: '550e8400-e29b-41d4-a716-446655440001' },
        update: { userId: user.id },
        create: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Test Broker 1',
          code: 'TB001',
          isActive: true
        }
      }),
      prisma.broker.upsert({
        where: { id: '550e8400-e29b-41d4-a716-446655440002' },
        update: { userId: user.id },
        create: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Test Broker 2',
          code: 'TB002',
          isActive: true
        }
      }),
      prisma.broker.upsert({
        where: { id: '550e8400-e29b-41d4-a716-446655440003' },
        update: { userId: user.id },
        create: {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'Test Broker 3',
          code: 'TB003',
          isActive: true
        }
      })
    ]);

    // Client-Broker ilişkileri
    await Promise.all([
      prisma.clientBroker.upsert({
        where: {
          clientId_brokerId: {
            clientId: client.id,
            brokerId: brokers[0].id
          }
        },
        update: {},
        create: {
          clientId: client.id,
          brokerId: brokers[0].id
        }
      }),
      prisma.clientBroker.upsert({
        where: {
          clientId_brokerId: {
            clientId: client.id,
            brokerId: brokers[1].id
          }
        },
        update: {},
        create: {
          clientId: client.id,
          brokerId: brokers[1].id
        }
      }),
      prisma.clientBroker.upsert({
        where: {
          clientId_brokerId: {
            clientId: client.id,
            brokerId: brokers[2].id
          }
        },
        update: {},
        create: {
          clientId: client.id,
          brokerId: brokers[2].id
        }
      })
    ]);

    console.log('Test verileri başarıyla oluşturuldu:');
    console.log('- User:', user.email);
    console.log('- Client:', client.name, 'UserId:', client.userId);
    console.log('- Brokers:', brokers.map(b => b.name).join(', '));
    console.log('- Client-Broker ilişkileri:', brokers.length);

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCompleteTestData();