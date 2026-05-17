const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return console.log('No user');
    console.log('Testing refresh token creation for user:', user.id);
    await prisma.refreshToken.create({
      data: {
        token: 'test_token_' + Date.now(),
        userId: user.id,
        expiresAt: new Date()
      }
    });
    console.log('Success!');
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
