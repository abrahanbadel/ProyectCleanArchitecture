import { PrismaClient } from '../../generated/prisma/client';
import { MovementPersistence } from '../../domain/repositories/Repositories';
import { FinancialMovement } from '../../domain/entities/Transaction';
import { MovementMapper } from '../mappers/TransactionMapper';

export class SqlMovementPersistence implements MovementPersistence {
  constructor(private readonly db: PrismaClient) { }

  async save(movement: FinancialMovement): Promise<void> {
    const dbData = MovementMapper.mapToDb(movement);

    await this.db.transaction.upsert({
      where: { id: movement.id },
      update: {
        status: movement.status,
      },
      create: dbData,
    });
  }

  async getById(id: string): Promise<FinancialMovement | null> {
    const raw = await this.db.transaction.findUnique({ where: { id } });
    return raw ? MovementMapper.mapToDomain(raw) : null;
  }

  async getByAccount(accountId: string): Promise<FinancialMovement[]> {
    const rawList = await this.db.transaction.findMany({
      where: {
        OR: [
          { sourceAccountId: accountId },
          { destinationAccountId: accountId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return rawList.map(MovementMapper.mapToDomain);
  }
}
