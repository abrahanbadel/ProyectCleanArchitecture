import { Decimal } from 'decimal.js';
import { Transaction as PrismaTx, TransactionType, Prisma } from '../../generated/prisma/client';
import { FinancialMovement, Deposit, Withdrawal, Transfer } from '../../domain/entities/Transaction';

export class MovementMapper {
  public static mapToDomain(raw: PrismaTx): FinancialMovement {
    const base = {
      id: raw.id,
      amount: new Decimal(raw.amount.toString()),
      status: raw.status,
      description: raw.description ?? '',
      createdAt: raw.createdAt
    };

    switch (raw.type) {
      case TransactionType.DEPOSIT:
        if (!raw.destinationAccountId) throw new Error("DB Error: Missing destination for Deposit");
        return Deposit.create({
          value: base.amount,
          txStatus: base.status,
          note: base.description,
          timestamp: base.createdAt,
          targetAccount: raw.destinationAccountId
        });

      case TransactionType.WITHDRAWAL:
        if (!raw.sourceAccountId) throw new Error("DB Error: Missing source for Withdrawal");
        return Withdrawal.create({
          value: base.amount,
          txStatus: base.status,
          note: base.description,
          timestamp: base.createdAt,
          originAccount: raw.sourceAccountId
        });

      case TransactionType.TRANSFER:
        if (!raw.sourceAccountId || !raw.destinationAccountId) {
            throw new Error("DB Error: Transfer missing source or destination");
        }
        return Transfer.create({
          value: base.amount,
          txStatus: base.status,
          note: base.description,
          timestamp: base.createdAt,
          originAccount: raw.sourceAccountId,
          targetAccount: raw.destinationAccountId
        });

      default:
        throw new Error(`Unknown TxType: ${raw.type}`);
    }
  }

  public static mapToDb(movement: FinancialMovement): Prisma.TransactionUncheckedCreateInput {
    let type: TransactionType;
    let sourceId: string | null = null;
    let targetId: string | null = null;

    if (movement instanceof Deposit) {
      type = TransactionType.DEPOSIT;
      targetId = movement.destinationAccount;
    } else if (movement instanceof Withdrawal) {
      type = TransactionType.WITHDRAWAL;
      sourceId = movement.sourceAccount;
    } else if (movement instanceof Transfer) {
      type = TransactionType.TRANSFER;
      sourceId = movement.sourceAccount;
      targetId = movement.destinationAccount;
    } else {
      throw new Error("Invalid movement instance");
    }

    return {
      ...(movement.id ? { id: movement.id } : {}),
      amount: movement.amount,
      type,
      status: movement.status,
      description: movement.description,
      sourceAccountId: sourceId,
      destinationAccountId: targetId,
      createdAt: movement.createdAt,
    };
  }
}
