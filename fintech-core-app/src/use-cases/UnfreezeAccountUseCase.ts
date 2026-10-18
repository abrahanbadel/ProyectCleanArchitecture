import {
  AccountNotFrozenError,
  AccountNotFoundError,
  ForbiddenAccountAccessError,
} from '../domain/exceptions/FinancialError';
import { BankAccountPersistence } from '../domain/repositories/Repositories';

export class AccountReactivationService {
  constructor(private readonly bankRepo: BankAccountPersistence) {}

  async execute(accountId: string, requesterId: string): Promise<void> {
    const account = await this.bankRepo.getById(accountId);
    if (!account) {
      throw new AccountNotFoundError(accountId);
    }
    if (account.userId !== requesterId) {
      throw new ForbiddenAccountAccessError(accountId);
    }
    if (account.status === 'ACTIVE') {
      throw new AccountNotFrozenError(accountId);
    }

    account.setActive();
    await this.bankRepo.persist(account);
  }
}
