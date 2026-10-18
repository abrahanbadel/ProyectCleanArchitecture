import { Decimal } from 'decimal.js';
import { Account as PrismaAccount, Prisma } from '../../generated/prisma/client';
import { BankAccount, BankAccountStatus } from '../../domain/entities/Account';

export class BankAccountMapper {
  public static mapToDomain(raw: PrismaAccount): BankAccount {
    return BankAccount.initialize({
      uid: raw.id,
      iban: raw.accountNumber,
      currentBalance: new Decimal(raw.balance.toString()),
      ownerId: raw.userId,
      accountStatus: raw.status as BankAccountStatus,
      openedAt: raw.createdAt
    });
  }

  public static mapToDb(account: BankAccount): Prisma.AccountUncheckedCreateInput {
    return {
      ...(account.id ? { id: account.id } : {}),
      accountNumber: account.accountNumber,
      balance: account.balance,
      userId: account.userId,
      status: account.status,
      createdAt: account.createdAt,
    };
  }
}
