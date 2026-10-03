import { AccountRepository } from "../domain/repositories/Repositories";
import { AccountOutputDTO, GetUserAccountsInputDTO } from "./dto/AccountDTOs";

export class GetUserAccountsUseCase {

  constructor(private readonly accountRepository: AccountRepository) { }

  async execute(input: GetUserAccountsInputDTO): Promise<AccountOutputDTO[]> {
    const accounts = await this.accountRepository.findByUserId(input.userId);

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