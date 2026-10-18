import { Decimal } from 'decimal.js';
import {
  InsufficientBalanceError,
  AccountFrozenError,
  InvalidAmountError
} from '../exceptions/FinancialError';

export type BankAccountStatus = 'ACTIVE' | 'FROZEN';

export interface BankAccountProps {
  uid: string;
  iban: string;
  currentBalance: Decimal;
  ownerId: string;
  accountStatus: BankAccountStatus;
  openedAt: Date;
}

export class BankAccount {
  private readonly data: BankAccountProps;

  private constructor(props: BankAccountProps) {
    this.data = props;
  }

  public static initialize(props: BankAccountProps): BankAccount {
    if (props.currentBalance.isNegative()) {
      throw new InvalidAmountError('No se permite la apertura de cuentas con saldo negativo.');
    }
    return new BankAccount(props);
  }

  get id(): string { return this.data.uid; }
  get accountNumber(): string { return this.data.iban; }
  get balance(): Decimal { return this.data.currentBalance; }
  get userId(): string { return this.data.ownerId; }
  get status(): BankAccountStatus { return this.data.accountStatus; }
  get createdAt(): Date { return this.data.openedAt; }

  public applyDeposit(amount: Decimal): void {
    if (amount.lte(0)) {
      throw new InvalidAmountError('El monto a depositar debe ser positivo.');
    }

    if (this.data.accountStatus === 'FROZEN') {
      throw new AccountFrozenError(this.id);
    }

    this.data.currentBalance = this.data.currentBalance.plus(amount);
  }

  public applyWithdrawal(amount: Decimal): void {
    if (amount.lte(0)) {
      throw new InvalidAmountError('El monto a retirar debe ser positivo.');
    }
    if (this.data.accountStatus === 'FROZEN') {
      throw new AccountFrozenError(this.id);
    }
    if (this.data.currentBalance.lessThan(amount)) {
      throw new InsufficientBalanceError(this.id);
    }
    this.data.currentBalance = this.data.currentBalance.minus(amount);
  }

  public setFrozen(): void {
    this.data.accountStatus = 'FROZEN';
  }

  public setActive(): void {
    this.data.accountStatus = 'ACTIVE';
  }
}
