import { PrismaClient } from '../../generated/prisma/client';
import { AccountRepository } from '../../domain/repositories/Repositories';
import { Account } from '../../domain/entities/Account';
import { Deposit, Transfer, Transaction, Withdrawal } from '../../domain/entities/Transaction';
import { AccountMapper } from '../mappers/AccountMapper';
import { TransactionMapper } from '../mappers/TransactionMapper';
import { AccountNotFoundError } from '../../domain/exceptions/FinancialError';

export class PrismaAccountRepository implements AccountRepository {
  // Inyección de dependencias a través del constructor
  constructor(private readonly prisma: PrismaClient) { }

  async save(account: Account): Promise<void> {
    const data = AccountMapper.toPersistence(account);

    // Utilizamos 'upsert' que funciona como "Insertar si no existe, Actualizar si ya existe"
    // Esto centraliza la lógica de persistencia en un solo método robusto.
    await this.prisma.account.upsert({
      where: { id: account.id },
      update: {
        balance: account.balance,
        status: account.status,
      },
      create: data,
    });
  }

  async update(account: Account): Promise<void> {
    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        balance: account.balance,
        status: account.status,
      },
    });
  }

  async executeTransaction(transaction: Transaction): Promise<Transaction> {
    transaction.execute();

    await this.prisma.$transaction(async (tx) => {
      if (transaction instanceof Transfer) {
        const prismaSource = await tx.account.findUnique({
          where: { id: transaction.sourceAccount },
        });
        const prismaDestination = await tx.account.findUnique({
          where: { id: transaction.destinationAccount },
        });

        if (!prismaSource) throw new AccountNotFoundError(transaction.sourceAccount);
        if (!prismaDestination) throw new AccountNotFoundError(transaction.destinationAccount);

        const sourceAccount = AccountMapper.toDomain(prismaSource);
        const destinationAccount = AccountMapper.toDomain(prismaDestination);

        sourceAccount.withdraw(transaction.amount);
        destinationAccount.deposit(transaction.amount);

        await tx.account.update({
          where: { id: sourceAccount.id },
          data: {
            balance: sourceAccount.balance,
            status: sourceAccount.status,
          },
        });

        await tx.account.update({
          where: { id: destinationAccount.id },
          data: {
            balance: destinationAccount.balance,
            status: destinationAccount.status,
          },
        });
      } else if (transaction instanceof Withdrawal) {
        const prismaAccount = await tx.account.findUnique({
          where: { id: transaction.sourceAccount },
        });

        if (!prismaAccount) throw new AccountNotFoundError(transaction.sourceAccount);

        const account = AccountMapper.toDomain(prismaAccount);
        account.withdraw(transaction.amount);

        await tx.account.update({
          where: { id: account.id },
          data: {
            balance: account.balance,
            status: account.status,
          },
        });
      } else if (transaction instanceof Deposit) {
        const prismaAccount = await tx.account.findUnique({
          where: { id: transaction.destinationAccount },
        });

        if (!prismaAccount) throw new AccountNotFoundError(transaction.destinationAccount);

        const account = AccountMapper.toDomain(prismaAccount);
        account.deposit(transaction.amount);

        await tx.account.update({
          where: { id: account.id },
          data: {
            balance: account.balance,
            status: account.status,
          },
        });
      } else {
        throw new Error('Tipo de transacción no soportado en executeTransaction');
      }

      await tx.transaction.create({
        data: TransactionMapper.toPersistence(transaction),
      });
    });

    return transaction;
  }

  async findById(id: string): Promise<Account | null> {
    const prismaAccount = await this.prisma.account.findUnique({
      where: { id }
    });

    if (!prismaAccount) return null;

    // Inmediatamente traducimos la respuesta de Prisma a nuestro lenguaje de Dominio
    return AccountMapper.toDomain(prismaAccount);
  }

  async findByAccountNumber(accountNumber: string): Promise<Account | null> {
    const prismaAccount = await this.prisma.account.findUnique({
      where: { accountNumber }
    });

    if (!prismaAccount) return null;

    // Inmediatamente traducimos la respuesta de Prisma a nuestro lenguaje de Dominio
    return AccountMapper.toDomain(prismaAccount);
  }

  async findByUserId(userId: string): Promise<Account[]> {
    const prismaAccounts = await this.prisma.account.findMany({
      where: { userId }
    });

    // Inmediatamente traducimos las respuestas de Prisma a nuestro lenguaje de Dominio
    return prismaAccounts.map(AccountMapper.toDomain);
  }
}
