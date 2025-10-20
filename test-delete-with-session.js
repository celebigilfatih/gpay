import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDeleteWithSession() {
  try {
    console.log('🔍 Testing DELETE with session simulation...');
    
    // Test client ID
    const clientId = 'e410d4dd-9b7a-4064-87da-0ac4ffc39f2c';
    
    // First, get the client to verify it exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { user: true }
    });
    
    if (!client) {
      console.log('❌ Client not found');
      return;
    }
    
    console.log('✅ Client found:', {
      id: client.id,
      name: client.fullName,
      userId: client.userId,
      userEmail: client.user.email
    });
    
    // Test the DELETE endpoint with fetch (simulating browser request)
    const response = await fetch(`http://localhost:3001/api/clients/${clientId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // Simulating a session cookie (this won't work without real session)
        'Cookie': 'next-auth.session-token=test-token'
      }
    });
    
    console.log('📡 DELETE Response Status:', response.status);
    console.log('📡 DELETE Response Status Text:', response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ DELETE Error Response:', errorText);
    } else {
      const result = await response.json();
      console.log('✅ DELETE Success:', result);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteWithSession();
