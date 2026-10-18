import { Decimal } from 'decimal.js';
import { BankAccountPersistence } from '../domain/repositories/Repositories';
import {
  InvalidAmountError,
  AccountNotFoundError,
  ForbiddenAccountAccessError,
} from '../domain/exceptions/FinancialError';
import { CashWithdrawalRequest, CashWithdrawalResponse } from './dto/WithdrawalDTOs';
import { Withdrawal } from '../domain/entities/Transaction';

export class CashWithdrawalService {
  constructor(private readonly bankRepo: BankAccountPersistence) {}

  async execute(
    payload: CashWithdrawalRequest,
    requesterId: string,
  ): Promise<CashWithdrawalResponse> {
    const { accountId, amount } = payload;

    if (amount <= 0) {
      throw new InvalidAmountError('El monto a retirar debe ser un valor positivo.');
    }

    await this.assertOwnership(accountId, requesterId);

    const volume = new Decimal(amount);
    const movement = Withdrawal.create({
      value: volume,
      txStatus: 'COMPLETED',
      originAccount: accountId,
      timestamp: new Date(),
      note: `Retiro de ${volume.toFixed(4)} desde la cuenta ${accountId}.`,
    });

    await this.bankRepo.recordMovement(movement);

    const updatedAccount = await this.bankRepo.getById(accountId);
    if (!updatedAccount) {
      throw new AccountNotFoundError(accountId);
    }

    return {
      accountId,
      newBalance: Number(updatedAccount.balance.toString()),
      withdrawnAt: new Date(),
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
