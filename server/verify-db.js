const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Verificando Banco de Dados ---');
  
  const users = await prisma.user.count();
  console.log(`Usuários: ${users}`);

  const budgets = await prisma.budget.count();
  console.log(`Orçamentos: ${budgets}`);

  const goals = await prisma.goal.count();
  console.log(`Metas: ${goals}`);

  const transactions = await prisma.financialTransaction.count();
  console.log(`Transações: ${transactions}`);

  const alerts = await prisma.alert.count();
  console.log(`Alertas: ${alerts}`);

  console.log('----------------------------------');
  
  if (users > 0) {
    const lastUser = await prisma.user.findFirst({ orderBy: { created_at: 'desc' } });
    console.log('Último usuário criado:', lastUser.phone);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
