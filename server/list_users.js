const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({
    include: {
      organizations: true
    }
  });
  console.log('Users:', JSON.stringify(users, null, 2));
}

listUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
