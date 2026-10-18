import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { SqlBankAccountPersistence } from '../../src/infrastructure/Repositories/PrismaAccountRepository';
import { SqlUserPersistence } from '../../src/infrastructure/Repositories/PrismaUserRepository';
import { User } from '../../src/domain/entities/User';
import { BankAccount } from '../../src/domain/entities/Account';
import { Deposit, Transfer } from '../../src/domain/entities/Transaction';
import { Decimal } from 'decimal.js';

const runIntegration =
  Boolean(process.env.DATABASE_URL) && process.env.RUN_INTEGRATION === '1';

describe.skipIf(!runIntegration)('SqlBankAccountPersistence (integración)', () => {
  let prisma: PrismaClient;
  let bankRepo: SqlBankAccountPersistence;
  let userRepo: SqlUserPersistence;
  let userId: string;
  let accountA: string;
  let accountB: string;

  beforeAll(async () => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
    });
    bankRepo = new SqlBankAccountPersistence(prisma);
    userRepo = new SqlUserPersistence(prisma);

    const user = await userRepo.upsert(
      User.create({
        id: crypto.randomUUID(),
        email: `integration-${Date.now()}@example.com`,
        passwordHash: '$2b$10$testhash',
        fullName: 'Integration User',
        createdAt: new Date(),
      }),
    );
    userId = user.id!;

    const a = BankAccount.initialize({
      uid: crypto.randomUUID(),
      iban: `ACC-INT-A-${Date.now()}`,
      currentBalance: new Decimal('200.0000'),
      ownerId: userId,
      accountStatus: 'ACTIVE',
      openedAt: new Date(),
    });
    const b = BankAccount.initialize({
      uid: crypto.randomUUID(),
      iban: `ACC-INT-B-${Date.now()}`,
      currentBalance: new Decimal('50.0000'),
      ownerId: userId,
      accountStatus: 'ACTIVE',
      openedAt: new Date(),
    });
    await bankRepo.save(a);
    await bankRepo.save(b);
    accountA = a.id;
    accountB = b.id;
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.transaction.deleteMany({
      where: {
        OR: [
          { sourceAccountId: { in: [accountA, accountB] } },
          { destinationAccountId: { in: [accountA, accountB] } },
        ],
      },
    });
    await prisma.account.deleteMany({ where: { id: { in: [accountA, accountB] } } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('persiste un depósito atómico y actualiza saldo', async () => {
    const movement = Deposit.create({
      value: new Decimal('25.0000'),
      txStatus: 'COMPLETED',
      targetAccount: accountA,
      timestamp: new Date(),
      note: 'depósito integración',
    });

    await bankRepo.recordMovement(movement);
    const updated = await bankRepo.getById(accountA);

    expect(updated).not.toBeNull();
    expect(updated!.balance.equals(new Decimal('225.0000'))).toBe(true);
  });

  it('transfiere con bloqueo y deja saldos coherentes', async () => {
    const beforeA = await bankRepo.getById(accountA);
    const beforeB = await bankRepo.getById(accountB);
    const amount = new Decimal('10.0000');

    const movement = Transfer.create({
      value: amount,
      txStatus: 'COMPLETED',
      originAccount: accountA,
      targetAccount: accountB,
      timestamp: new Date(),
      note: 'transfer integración',
    });

    await bankRepo.recordMovement(movement);

    const afterA = await bankRepo.getById(accountA);
    const afterB = await bankRepo.getById(accountB);

    expect(afterA!.balance.equals(beforeA!.balance.minus(amount))).toBe(true);
    expect(afterB!.balance.equals(beforeB!.balance.plus(amount))).toBe(true);
  });
});
