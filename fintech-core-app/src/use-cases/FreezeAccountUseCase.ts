import { BankAccountPersistence } from '../domain/repositories/Repositories';
import {
  AccountAlreadyFrozenError,
  AccountNotFoundError,
  ForbiddenAccountAccessError,
} from '../domain/exceptions/FinancialError';

export class AccountFreezeService {
  constructor(private readonly bankRepo: BankAccountPersistence) {}

  async execute(accountId: string, requesterId: string): Promise<void> {
    const account = await this.bankRepo.getById(accountId);
    if (!account) {
      throw new AccountNotFoundError(accountId);
    }
    if (account.userId !== requesterId) {
      throw new ForbiddenAccountAccessError(accountId);
    }
    if (account.status === 'FROZEN') {
      throw new AccountAlreadyFrozenError(accountId);
    }

    account.setFrozen();
    await this.bankRepo.persist(account);
  }
}
