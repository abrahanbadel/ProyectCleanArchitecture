import { Decimal } from 'decimal.js';
import { Account as PrismaAccount, Prisma } from '../../generated/prisma/client';
import { Account, AccountStatus } from '../../domain/entities/Account';


export class AccountMapper {
  /**
   * Convierte un registro de infraestructura a una entidad de dominio puro
   */
  public static toDomain(prismaAccount: PrismaAccount): Account {
    return Account.create({
      id: prismaAccount.id,
      accountNumber: prismaAccount.accountNumber,
      balance: new Decimal(prismaAccount.balance.toString()), // Evita problemas de conversión de tipos de Decimal
      userId: prismaAccount.userId,
      status: prismaAccount.status as AccountStatus, // Casting seguro para alinear el enum de Prisma con el de dominio
      createdAt: prismaAccount.createdAt
    });
  }

  /**
   * Convierte una entidad de dominio a la estructura requerida por Prisma
   */
  public static toPersistence(account: Account): Prisma.AccountUncheckedCreateInput {
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