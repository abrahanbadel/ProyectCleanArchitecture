import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { SqlUserPersistence } from '../../src/infrastructure/Repositories/PrismaUserRepository';
import { User } from '../../src/domain/entities/User';

const runIntegration = Boolean(process.env.DATABASE_URL) && process.env.RUN_INTEGRATION === '1';

describe.skipIf(!runIntegration)('SqlUserPersistence (integración)', () => {
  let prisma: PrismaClient;
  let userRepo: SqlUserPersistence;
  let createdId: string;
  const email = `user-int-${Date.now()}@example.com`;

  beforeAll(() => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
    });
    userRepo = new SqlUserPersistence(prisma);
  });

  afterAll(async () => {
    if (!prisma) return;
    if (createdId) {
      await prisma.account.deleteMany({ where: { userId: createdId } });
      await prisma.user.deleteMany({ where: { id: createdId } });
    }
    await prisma.$disconnect();
  });

  it('guarda y recupera un usuario por email e id', async () => {
    const saved = await userRepo.upsert(
      User.create({
        id: crypto.randomUUID(),
        email,
        passwordHash: '$2b$10$testhash',
        fullName: 'Repo Integration',
        createdAt: new Date(),
      }),
    );
    createdId = saved.id!;

    const byEmail = await userRepo.getByEmail(email);
    const byId = await userRepo.getById(createdId);

    expect(byEmail?.email).toBe(email);
    expect(byId?.fullName).toBe('Repo Integration');
    expect(byId?.passwordHash).toBe('$2b$10$testhash');
  });
});
