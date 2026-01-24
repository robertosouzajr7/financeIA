const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
  const phone = '5511999999999';
  const password = 'password123';
  const passwordHash = Buffer.from(password).toString('base64'); // Simulating legacy base64 hash

  const user = await prisma.user.upsert({
    where: { user_phone: phone },
    update: {},
    create: {
      user_phone: phone,
      password_hash: passwordHash,
      is_authenticated: false,
    },
  });

  console.log({ user });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
