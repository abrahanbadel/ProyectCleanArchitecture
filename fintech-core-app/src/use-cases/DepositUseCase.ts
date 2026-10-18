import { Decimal } from 'decimal.js';
import { BankAccountPersistence } from '../domain/repositories/Repositories';
import {
  InvalidAmountError,
  AccountNotFoundError,
  ForbiddenAccountAccessError,
} from '../domain/exceptions/FinancialError';
import { FundDepositRequest, FundDepositResponse } from './dto/DepositDTOs';
import { Deposit } from '../domain/entities/Transaction';

export class FundDepositService {
  constructor(private readonly bankRepo: BankAccountPersistence) {}

  async execute(
    payload: FundDepositRequest,
    requesterId: string,
  ): Promise<FundDepositResponse> {
    const { accountId, amount } = payload;

    if (amount <= 0) {
      throw new InvalidAmountError('El monto a depositar debe ser un valor positivo.');
    }

    await this.assertOwnership(accountId, requesterId);

    const volume = new Decimal(amount);
    const movement = Deposit.create({
      value: volume,
      txStatus: 'COMPLETED',
      targetAccount: accountId,
      timestamp: new Date(),
      note: `Depósito de ${volume.toFixed(4)} a la cuenta ${accountId}.`,
    });

    await this.bankRepo.recordMovement(movement);

    const updatedAccount = await this.bankRepo.getById(accountId);
    if (!updatedAccount) {
      throw new AccountNotFoundError(accountId);
    }

    return {
      accountId,
      newBalance: Number(updatedAccount.balance.toString()),
      depositedAt: new Date(),
    };
  }

  private async assertOwnership(accountId: string, requesterId: string): Promise<void> {
    const account = await this.bankRepo.getById(accountId);
    if (!account) {
      throw new AccountNotFoundError(accountId);
    }
    if (account.userId !== requesterId) {
      throw new ForbiddenAccountAccessError(accountId);
    }
  }
}
