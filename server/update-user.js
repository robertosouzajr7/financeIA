const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const oldPhone = '5571992042802';
  const newPhone = '557197281238';

  try {
    const user = await prisma.user.update({
      where: { user_phone: oldPhone },
      data: { user_phone: newPhone }
    });
    console.log(`✅ User updated successfully!`);
    console.log(`ID: ${user.id}`);
    console.log(`Name: ${user.user_name}`);
    console.log(`New Phone: ${user.user_phone}`);
  } catch (error) {
    if (error.code === 'P2025') {
       console.log(`User with phone ${oldPhone} not found. Trying to find by ID if possible, but let's assume it exists from previous list.`);
    } else {
       console.error('Error updating user:', error);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
