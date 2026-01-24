const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Iniciando migração para Organizações...');

  try {
    const users = await prisma.user.findMany({
      include: {
        organizations: true
      }
    });

    console.log(`👥 Encontrados ${users.length} usuários.`);

    for (const user of users) {
      if (user.organizations.length > 0) {
        console.log(`⏭️  Usuário ${user.user_phone} já tem organização. Pulando.`);
        continue;
      }

      const orgName = user.user_name ? `${user.user_name}'s Org` : `Org ${user.user_phone}`;
      const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 7);

      console.log(`✨ Criando organização para ${user.user_phone}: ${orgName}`);

      // Criar Organização e Membro
      const org = await prisma.organization.create({
        data: {
          name: orgName,
          slug: slug,
          members: {
            create: {
              user_id: user.id,
              role: 'OWNER'
            }
          }
        }
      });

      console.log(`   ✅ Organização criada: ${org.id}`);

      // Migrar dados existentes para a nova organização
      const updateData = { organization_id: org.id };

      const transactions = await prisma.financialTransaction.updateMany({
        where: { user_phone: user.user_phone, organization_id: null },
        data: updateData
      });
      console.log(`   📊 ${transactions.count} transações migradas.`);

      const budgets = await prisma.budget.updateMany({
        where: { user_phone: user.user_phone, organization_id: null },
        data: updateData
      });
      console.log(`   💰 ${budgets.count} orçamentos migrados.`);

      const goals = await prisma.goal.updateMany({
        where: { user_phone: user.user_phone, organization_id: null },
        data: updateData
      });
      console.log(`   🎯 ${goals.count} metas migradas.`);
      
      const subscriptions = await prisma.subscription.updateMany({
        where: { user_email: user.user_phone, organization_id: null }, // user_email é user_phone no schema antigo
        data: updateData
      });
      console.log(`   💳 ${subscriptions.count} assinaturas migradas.`);

      const alerts = await prisma.alert.updateMany({
        where: { user_phone: user.user_phone, organization_id: null },
        data: updateData
      });
      console.log(`   🔔 ${alerts.count} alertas migrados.`);

      const recurring = await prisma.recurringExpense.updateMany({
        where: { user_phone: user.user_phone, organization_id: null },
        data: updateData
      });
      console.log(`   🔄 ${recurring.count} despesas recorrentes migradas.`);
      
      const debts = await prisma.debt.updateMany({
        where: { user_phone: user.user_phone, organization_id: null },
        data: updateData
      });
      console.log(`   💸 ${debts.count} dívidas migradas.`);

      const whatsapp = await prisma.whatsAppInstance.updateMany({
        where: { user_email: user.user_phone, organization_id: null },
        data: updateData
      });
      console.log(`   📱 ${whatsapp.count} instâncias WhatsApp migradas.`);

    }

    console.log('✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
