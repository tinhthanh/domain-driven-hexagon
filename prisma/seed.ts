import { PrismaClient } from '@prisma/client';
import { UserRoles } from '../src/modules/user/domain/user.types';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'john@gmail.com' },
    update: {},
    create: {
      id: 'f59d0748-d455-4465-b0a8-8d8260b1c877',
      email: 'john@gmail.com',
      country: 'England',
      postalCode: '24312',
      street: 'Road Avenue',
      role: UserRoles.guest,
    },
  });

  console.log('Created user:', user);

  // Create a wallet for the user
  const wallet = await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      id: crypto.randomUUID(),
      balance: 0,
      userId: user.id,
    },
  });

  console.log('Created wallet:', wallet);

  console.log('Seeding finished.');
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
