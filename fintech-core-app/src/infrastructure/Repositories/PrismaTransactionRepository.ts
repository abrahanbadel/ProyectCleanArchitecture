import { PrismaClient } from '../../generated/prisma/client';
import { TransactionRepository } from '../../domain/repositories/Repositories';
import { Transaction } from '../../domain/entities/Transaction';
import { TransactionMapper } from '../mappers/TransactionMapper';

export class PrismaTransactionRepository implements TransactionRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async save(transaction: Transaction): Promise<void> {
    const data = TransactionMapper.toPersistence(transaction);

    await this.prisma.transaction.upsert({
      where: { id: transaction.id },
      update: {
        status: transaction.status,
      },
      create: data,
    });
  }

  async findById(id: string): Promise<Transaction | null> {
    const prismaTransaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!prismaTransaction) return null;

    return TransactionMapper.toDomain(prismaTransaction);
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    const prismaTransactions = await this.prisma.transaction.findMany({
      where: {
        OR: [
          { sourceAccountId: accountId },
          { destinationAccountId: accountId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return prismaTransactions.map(TransactionMapper.toDomain);
  }
}
