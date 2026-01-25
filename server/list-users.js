const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Registered Users:');
  users.forEach(u => {
    console.log(`- ID: ${u.id}, Name: ${u.user_name}, Phone: ${u.user_phone}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
