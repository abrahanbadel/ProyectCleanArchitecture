import { BankAccountPersistence } from '../domain/repositories/Repositories';
import {
  AccountNotFoundError,
  ForbiddenAccountAccessError,
} from '../domain/exceptions/FinancialError';
import { GetBalanceInputDTO, AccountOutputDTO } from './dto/AccountDTOs';

export class BalanceInquiryService {
  constructor(private readonly bankRepo: BankAccountPersistence) {}

  async execute(payload: GetBalanceInputDTO, requesterId: string): Promise<AccountOutputDTO> {
    const account = await this.bankRepo.getById(payload.accountId);

    if (!account) {
      throw new AccountNotFoundError(payload.accountId);
    }
    if (account.userId !== requesterId) {
      throw new ForbiddenAccountAccessError(payload.accountId);
    }

    return {
      id: account.id,
      accountNumber: account.accountNumber,
      balance: account.balance,
      status: account.status,
      userId: account.userId,
      createdAt: account.createdAt,
    };
  }
}
