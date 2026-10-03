import { Decimal } from 'decimal.js';
import { Transaction as PrismaTransaction, TransactionType, Prisma } from '../../generated/prisma/client';
import { Transaction, Deposit, Withdrawal, Transfer} from '../../domain/entities/Transaction';

export class TransactionMapper {
  
  public static toDomain(prismaTx: PrismaTransaction): Transaction {
    const txProps = {
      id: prismaTx.id,
      amount: new Decimal(prismaTx.amount.toNumber()),
      status: prismaTx.status,
      description: prismaTx.description ?? '',
      createdAt: prismaTx.createdAt
    };

    // Reconstrucción polimórfica basada en el discriminador STI
    switch (prismaTx.type) {
      case TransactionType.DEPOSIT:
        if (!prismaTx.destinationAccountId) throw new Error("Inconsistencia en DB: Deposit requiere destinationAccountId");
        return Deposit.create({...txProps, destinationAccountId: prismaTx.destinationAccountId });

      case TransactionType.WITHDRAWAL:
        if (!prismaTx.sourceAccountId) throw new Error("Inconsistencia en DB: Withdrawal requiere sourceAccountId");
        return Withdrawal.create({...txProps, sourceAccountId: prismaTx.sourceAccountId });

      case TransactionType.TRANSFER:
        if (!prismaTx.sourceAccountId || !prismaTx.destinationAccountId) {
            throw new Error("Inconsistencia en DB: Transfer requiere ambas cuentas (origen y destino)");
        }
        return Transfer.create({...txProps, sourceAccountId: prismaTx.sourceAccountId, destinationAccountId: prismaTx.destinationAccountId });

      default:
        throw new Error(`Tipo de transacción desconocido o corrupto en DB: ${prismaTx.type}`);
    }
  }

  public static toPersistence(transaction: Transaction): Prisma.TransactionUncheckedCreateInput {
    let type: TransactionType;
    let sourceAccountId: string | null = null;
    let destinationAccountId: string | null = null;

    // Dependiendo de la instancia en memoria, determinamos la forma del registro plano
    if (transaction instanceof Deposit) {
      type = TransactionType.DEPOSIT;
      destinationAccountId = transaction.destinationAccount;
    } else if (transaction instanceof Withdrawal) {
      type = TransactionType.WITHDRAWAL;
      sourceAccountId = transaction.sourceAccount;
    } else if (transaction instanceof Transfer) {
      type = TransactionType.TRANSFER;
      sourceAccountId = transaction.sourceAccount;
      destinationAccountId = transaction.destinationAccount;
    } else {
      throw new Error("Instancia de transacción inválida proporcionada al Mapper");
    }

    return {
      ...(transaction.id ? { id: transaction.id } : {}),
      amount: transaction.amount,
      type,
      status: transaction.status,
      description: transaction.description,
      sourceAccountId,
      destinationAccountId,
      createdAt: transaction.createdAt,
    };
  }
}