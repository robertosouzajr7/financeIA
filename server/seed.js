const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const phone = '5511999999999';
  const password = 'password123';
  
  // Use bcrypt for security (simulating production-like env even in dev)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  console.log(`🌱 Seeding database for user: ${phone}`);

  // 1. Create or Update User
  const user = await prisma.user.upsert({
    where: { user_phone: phone },
    update: {
      password_hash: passwordHash,
      is_authenticated: true,
      last_authenticated: new Date(),
    },
    create: {
      user_phone: phone,
      user_name: 'Admin User',
      password_hash: passwordHash,
      is_authenticated: true,
      last_authenticated: new Date(),
    },
  });

  console.log(`✅ User created/updated: ${user.id}`);

  // 2. Create Organization
  const orgName = "FinanceIA Admin Org";
  let org = await prisma.organization.findFirst({
    where: { members: { some: { user_id: user.id, role: 'OWNER' } } }
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: orgName,
        slug: 'financeia-admin',
        members: {
          create: {
            user_id: user.id,
            role: 'OWNER'
          }
        }
      }
    });
    console.log(`✅ Organization created: ${org.name}`);
  } else {
    console.log(`ℹ️ User already has organization: ${org.name}`);
  }

  // 3. Create Plans
  const plans = [
    { name: 'Basic', price: 49.00, interval: 'month', features: JSON.stringify(['5 Alertas', '5 Orçamentos']) },
    { name: 'Pro', price: 149.00, interval: 'month', features: JSON.stringify(['Ilimitado']) }
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { id: p.name.toLowerCase() }, // Using name as simplistic ID for seed
      update: {},
      create: {
        id: p.name.toLowerCase(),
        name: p.name,
        price: p.price,
        interval: p.interval,
        features: p.features
      }
    });
  }
  console.log('✅ Plans seeded');

  // 4. Create Subscription for User
  const existingSub = await prisma.subscription.findFirst({
    where: { organization_id: org.id }
  });

  if (!existingSub) {
    await prisma.subscription.create({
      data: {
        organization_id: org.id,
        user_email: user.user_phone, // Schema legacy field, using phone
        plan_id: 'pro',
        status: 'active'
      }
    });
    console.log('✅ Pro Subscription created for organization');
  } else {
     console.log('ℹ️ Organization already has subscription');
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('------------------------------------------------');
  console.log(`👤 User Phone: ${phone}`);
  console.log(`🔑 Password:   ${password}`);
  console.log('------------------------------------------------');
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
