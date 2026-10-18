import { Decimal } from 'decimal.js';
import { BankAccount, BankAccountStatus } from '../../src/domain/entities/Account';

type FactoryInput = {
  uid?: string;
  iban?: string;
  currentBalance?: Decimal | string | number;
  ownerId?: string;
  accountStatus?: BankAccountStatus;
  openedAt?: Date;
};

/** Fábrica de cuentas de prueba alineada al dominio BankAccount. */
export function buildBankAccount(input: FactoryInput = {}): BankAccount {
  return BankAccount.initialize({
    uid: input.uid ?? 'acc-1',
    iban: input.iban ?? 'ACC-1111',
    currentBalance: new Decimal(input.currentBalance ?? '100.00'),
    ownerId: input.ownerId ?? 'user-1',
    accountStatus: input.accountStatus ?? 'ACTIVE',
    openedAt: input.openedAt ?? new Date('2024-01-01T00:00:00.000Z'),
  });
}
