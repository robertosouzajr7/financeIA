const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); // Need to require bcryptjs
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { user_phone: '5511999999999' }
  });
  console.log('User found:', user);
  if (user) {
    const password = 'password123';
    console.log('Hash starts with $2a$ or $2b$?', user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$'));
    
    // Test bcrypt compare
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log(`Comparing '${password}' with hash '${user.password_hash}'`);
    console.log('IsValid?', isValid);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
