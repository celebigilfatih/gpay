const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clientBrokers = await prisma.clientBroker.findMany();
  console.log('ClientBroker kayıt sayısı:', clientBrokers.length);
  
  const clients = await prisma.client.findMany();
  console.log('Client sayısı:', clients.length);
  
  const brokers = await prisma.broker.findMany();
  console.log('Broker sayısı:', brokers.length);
  
  await prisma.$disconnect();
}

main().catch(console.error);