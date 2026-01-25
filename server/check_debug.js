const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { user_phone: '5571992042802' }
  });
  console.log('User exists:', user);
  
  const plans = await prisma.plan.findMany();
  console.log('Plans available:', plans);
}

checkUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
