import { BankAccountPersistence, MovementPersistence } from '../domain/repositories/Repositories';
import {
  AccountNotFoundError,
  ForbiddenAccountAccessError,
} from '../domain/exceptions/FinancialError';
import { MovementHistoryRequest, MovementHistoryResponse } from './dto/TransactionHistoryDTOs';
import {
  FinancialMovement,
  Deposit,
  Withdrawal,
  Transfer,
} from '../domain/entities/Transaction';

export class TransactionHistoryService {
  constructor(
    private readonly movementRepo: MovementPersistence,
    private readonly bankRepo: BankAccountPersistence,
  ) {}

  async execute(
    payload: MovementHistoryRequest,
    requesterId: string,
  ): Promise<MovementHistoryResponse> {
    const account = await this.bankRepo.getById(payload.accountId);
    if (!account) {
      throw new AccountNotFoundError(payload.accountId);
    }
    if (account.userId !== requesterId) {
      throw new ForbiddenAccountAccessError(payload.accountId);
    }

    const movements = await this.movementRepo.getByAccount(payload.accountId);

    return {
      accountId: payload.accountId,
      transactions: movements.map((movement: FinancialMovement) => {
        const type =
          movement instanceof Deposit
            ? 'DEPOSIT'
            : movement instanceof Withdrawal
              ? 'WITHDRAWAL'
              : 'TRANSFER';

        const sourceId =
          movement instanceof Withdrawal || movement instanceof Transfer
            ? movement.sourceAccount
            : undefined;

        const targetId =
          movement instanceof Deposit || movement instanceof Transfer
            ? movement.destinationAccount
            : undefined;

        return {
          id: movement.id,
          type,
          amount: Number(movement.amount.toString()),
          status: movement.status,
          description: movement.description,
          createdAt: movement.createdAt,
          ...(sourceId !== undefined ? { sourceAccountId: sourceId } : {}),
          ...(targetId !== undefined ? { destinationAccountId: targetId } : {}),
        };
      }),
    };
  }
}
