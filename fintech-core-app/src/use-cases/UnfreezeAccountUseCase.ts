import { AccountNotFrozenError, AccountNotFoundError } from "../domain/exceptions/FinancialError";
import { AccountRepository } from "../domain/repositories/Repositories";

export class UnfreezeAccountUseCase {
  constructor(private readonly accountRepository: AccountRepository) { }

  async execute(accountId: string): Promise<void> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new AccountNotFoundError(accountId);
    }

    if (account.status === "ACTIVE") {
      throw new AccountNotFrozenError(accountId);
    }

    account.unfreeze();

    await this.accountRepository.update(account);
  }
}