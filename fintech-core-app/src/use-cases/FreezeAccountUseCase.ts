import { AccountAlreadyFrozenError, AccountNotFoundError } from "../domain/exceptions/FinancialError";
import { AccountRepository } from "../domain/repositories/Repositories";

export class FreezeAccountUseCase {
  constructor(private readonly accountRepository: AccountRepository) { }

  async execute(accountId: string): Promise<void> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new AccountNotFoundError(accountId);
    }

    if (account.status === "FROZEN") {
      throw new AccountAlreadyFrozenError(accountId);
    }

    account.freeze();

    await this.accountRepository.update(account);
  }
}