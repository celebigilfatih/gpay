import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSessionStatus() {
  console.log('🔍 Session Status Test Başlatılıyor...\n');

  try {
    // Test 1: Port 3000'de GET request
    console.log('1️⃣ Port 3000 GET Test:');
    const getResponse = await fetch('http://localhost:3000/api/clients/e410d4dd-9b7a-4064-87da-0ac4ffc39f2c', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`   Status: ${getResponse.status}`);
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log(`   Client: ${data.fullName} - ${data.phoneNumber}`);
    } else {
      console.log(`   Error: ${await getResponse.text()}`);
    }

    // Test 2: Port 3000'de DELETE request
    console.log('\n2️⃣ Port 3000 DELETE Test:');
    const deleteResponse = await fetch('http://localhost:3000/api/clients/e410d4dd-9b7a-4064-87da-0ac4ffc39f2c', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`   Status: ${deleteResponse.status}`);
    const deleteResult = await deleteResponse.text();
    console.log(`   Response: ${deleteResult}`);

    // Test 3: NextAuth session endpoint test
    console.log('\n3️⃣ NextAuth Session Test:');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`   Status: ${sessionResponse.status}`);
    const sessionData = await sessionResponse.json();
    console.log(`   Session Data:`, JSON.stringify(sessionData, null, 2));

  } catch (error) {
    console.error('❌ Test sırasında hata:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSessionStatus();
