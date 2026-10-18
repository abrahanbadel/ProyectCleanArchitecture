import { BankAccountPersistence } from "../domain/repositories/Repositories";
import { AccountNotFoundError } from "../domain/exceptions/FinancialError";
import { GetUserAccountsInputDTO, AccountOutputDTO } from "./dto/AccountDTOs";

export class AccountProviderService {
  constructor(private readonly bankRepo: BankAccountPersistence) { }

  async execute(payload: GetUserAccountsInputDTO): Promise<AccountOutputDTO[]> {
    const accounts = await this.bankRepo.getByOwner(payload.userId);

    return accounts.map((account) => ({
      id: account.id,
      accountNumber: account.accountNumber,
      balance: account.balance,
      status: account.status,
      userId: account.userId,
      createdAt: account.createdAt,
    }));
  }
}
