const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ADMIN_ID = '4a0a8f98-9792-451c-9707-165650390f65';
const ADMIN_PHONE = '5511999999999';

async function cleanup() {
  console.log('Starting cleanup...');
  
  // 1. WhatsApp Instances
  const deletedInstances = await prisma.whatsAppInstance.deleteMany({
    where: {
      user_email: { not: ADMIN_PHONE }
    }
  });
  console.log(`Deleted ${deletedInstances.count} WhatsApp instances.`);

  // 2. Subscriptions
  const deletedSubs = await prisma.subscription.deleteMany({
    where: {
      user_email: { not: ADMIN_PHONE }
    }
  });
  console.log(`Deleted ${deletedSubs.count} Subscriptions.`);

  // 3. Transactions
  const deletedTrans = await prisma.financialTransaction.deleteMany({
    where: {
      user_phone: { not: ADMIN_PHONE }
    }
  });
  console.log(`Deleted ${deletedTrans.count} Transactions.`);

  // 4. Budgets
  const deletedBudgets = await prisma.budget.deleteMany({
    where: {
      user_phone: { not: ADMIN_PHONE }
    }
  });
  console.log(`Deleted ${deletedBudgets.count} Budgets.`);

  // 5. Goals
  const deletedGoals = await prisma.goal.deleteMany({
    where: {
      user_phone: { not: ADMIN_PHONE }
    }
  });
  console.log(`Deleted ${deletedGoals.count} Goals.`);
  
  // 6. Organization Members
  const deletedMembers = await prisma.organizationMember.deleteMany({
    where: {
      user_id: { not: ADMIN_ID }
    }
  });
  console.log(`Deleted ${deletedMembers.count} Members.`);

  // 7. Users
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { not: ADMIN_ID }
    }
  });
  console.log(`Deleted ${deletedUsers.count} Users.`);

  // 8. Clean up orphaned Organizations (OPTIONAL, but good practice)
  // Find organizations with no members
  const orgs = await prisma.organization.findMany({
    include: { _count: { select: { members: true } } }
  });
  
  for (const org of orgs) {
    if (org._count.members === 0) {
       await prisma.organization.delete({ where: { id: org.id } }).catch(console.error);
       console.log(`Deleted orphaned Organization: ${org.name}`);
    }
  }

  console.log('Cleanup complete.');
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
