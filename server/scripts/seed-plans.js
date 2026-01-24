const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPlans() {
  console.log('🌱 Seeding Plans...');

  const plans = [
    {
      name: 'Free',
      description: 'Para indivíduos começando a organizar suas finanças.',
      price: 0,
      interval: 'month',
      features: JSON.stringify(['1 Usuário', 'Gestão de Despesas Básica', 'Relatórios Simples']),
      is_active: true
    },
    {
      name: 'Pro',
      description: 'Para famílias e pequenas empresas que precisam de mais poder.',
      price: 29.90,
      interval: 'month',
      features: JSON.stringify(['Até 5 Usuários', 'Gestão de Orçamentos Avançada', 'Metas Ilimitadas', 'Suporte Prioritário']),
      is_active: true
    },
    {
      name: 'Enterprise',
      description: 'Para grandes organizações com necessidades complexas.',
      price: 99.90,
      interval: 'month',
      features: JSON.stringify(['Usuários Ilimitados', 'API Access', 'Gestor de Conta Dedicado', 'Relatórios Personalizados']),
      is_active: true
    }
  ];

  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name } });
    if (!existing) {
      await prisma.plan.create({ data: plan });
      console.log(`✅ Created plan: ${plan.name}`);
    } else {
      console.log(`⏭️  Plan ${plan.name} already exists.`);
    }
  }

  console.log('✅ Plans seeded successfully!');
}

seedPlans()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
