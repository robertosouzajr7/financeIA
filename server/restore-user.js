const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
  const phone = '557192042802'; // Número que estava nos logs
  const password = 'password123';
  const passwordHash = Buffer.from(password).toString('base64');

  const user = await prisma.user.upsert({
    where: { user_phone: phone },
    update: {
      password_hash: passwordHash,
      is_authenticated: false,
      conversation_started: false
    },
    create: {
      user_phone: phone,
      password_hash: passwordHash,
      is_authenticated: false,
      conversation_started: false
    },
  });

  console.log('✅ Usuário restaurado com sucesso:', user);
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
