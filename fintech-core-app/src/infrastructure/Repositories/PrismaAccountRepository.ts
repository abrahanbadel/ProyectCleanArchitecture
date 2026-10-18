import { Prisma, PrismaClient } from '../../generated/prisma/client';
import { BankAccountPersistence } from '../../domain/repositories/Repositories';
import { BankAccount } from '../../domain/entities/Account';
import { FinancialMovement, Deposit, Transfer, Withdrawal } from '../../domain/entities/Transaction';
import { BankAccountMapper } from '../mappers/AccountMapper';
import { MovementMapper } from '../mappers/TransactionMapper';
import { AccountNotFoundError } from '../../domain/exceptions/FinancialError';

type TxClient = Prisma.TransactionClient;

export class SqlBankAccountPersistence implements BankAccountPersistence {
  constructor(private readonly db: PrismaClient) {}

  async save(account: BankAccount): Promise<void> {
    const dbData = BankAccountMapper.mapToDb(account);
    await this.db.account.upsert({
      where: { id: account.id },
      update: {
        balance: account.balance,
        status: account.status,
      },
      create: dbData,
    });
  }

  async persist(account: BankAccount): Promise<void> {
    await this.db.account.update({
      where: { id: account.id },
      data: {
        balance: account.balance,
        status: account.status,
      },
    });
  }

  async recordMovement(movement: FinancialMovement): Promise<FinancialMovement> {
    movement.process();

    await this.db.$transaction(async (tx) => {
      if (movement instanceof Transfer) {
        await this.lockAccounts(tx, [movement.sourceAccount, movement.destinationAccount]);

        const rawSource = await tx.account.findUnique({ where: { id: movement.sourceAccount } });
        const rawTarget = await tx.account.findUnique({ where: { id: movement.destinationAccount } });

        if (!rawSource) throw new AccountNotFoundError(movement.sourceAccount);
        if (!rawTarget) throw new AccountNotFoundError(movement.destinationAccount);

        const source = BankAccountMapper.mapToDomain(rawSource);
        const target = BankAccountMapper.mapToDomain(rawTarget);

        source.applyWithdrawal(movement.amount);
        target.applyDeposit(movement.amount);

        await tx.account.update({
          where: { id: source.id },
          data: { balance: source.balance, status: source.status },
        });
        await tx.account.update({
          where: { id: target.id },
          data: { balance: target.balance, status: target.status },
        });
      } else if (movement instanceof Withdrawal) {
        await this.lockAccounts(tx, [movement.sourceAccount]);

        const raw = await tx.account.findUnique({ where: { id: movement.sourceAccount } });
        if (!raw) throw new AccountNotFoundError(movement.sourceAccount);

        const account = BankAccountMapper.mapToDomain(raw);
        account.applyWithdrawal(movement.amount);

        await tx.account.update({
          where: { id: account.id },
          data: { balance: account.balance, status: account.status },
        });
      } else if (movement instanceof Deposit) {
        await this.lockAccounts(tx, [movement.destinationAccount]);

        const raw = await tx.account.findUnique({ where: { id: movement.destinationAccount } });
        if (!raw) throw new AccountNotFoundError(movement.destinationAccount);

        const account = BankAccountMapper.mapToDomain(raw);
        account.applyDeposit(movement.amount);

        await tx.account.update({
          where: { id: account.id },
          data: { balance: account.balance, status: account.status },
        });
      } else {
        throw new Error('Movement type not supported');
      }

      await tx.transaction.create({
        data: MovementMapper.mapToDb(movement),
      });
    });

    return movement;
  }

  /**
   * Bloqueo pesimista determinista (orden por id) para evitar race conditions y deadlocks (RNF-2).
   */
  private async lockAccounts(tx: TxClient, accountIds: string[]): Promise<void> {
    const uniqueSorted = [...new Set(accountIds)].sort();
    for (const accountId of uniqueSorted) {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Account" WHERE id = ${accountId}::uuid FOR UPDATE
      `;
      if (rows.length === 0) {
        throw new AccountNotFoundError(accountId);
      }
    }
  }

  async getById(id: string): Promise<BankAccount | null> {
    const raw = await this.db.account.findUnique({ where: { id } });
    return raw ? BankAccountMapper.mapToDomain(raw) : null;
  }

  async getByIban(iban: string): Promise<BankAccount | null> {
    const raw = await this.db.account.findUnique({ where: { accountNumber: iban } });
    return raw ? BankAccountMapper.mapToDomain(raw) : null;
  }

  async getByOwner(userId: string): Promise<BankAccount[]> {
    const rawList = await this.db.account.findMany({ where: { userId } });
    return rawList.map(BankAccountMapper.mapToDomain);
  }
}
