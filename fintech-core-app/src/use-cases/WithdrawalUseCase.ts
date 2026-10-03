import { AccountRepository } from "../domain/repositories/Repositories";
import { InvalidAmountError, AccountNotFoundError, AccountFrozenError, InsufficientBalanceError } from "../domain/exceptions/FinancialError";
import { WithdrawalInputDTO, WithdrawalOutputDTO } from "./dto/WithdrawalDTOs";
import { Withdrawal } from "../domain/entities/Transaction";
import { Decimal } from "decimal.js";

export class WithdrawalUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: WithdrawalInputDTO): Promise<WithdrawalOutputDTO> {
    const { accountId, amount } = input;

    if (amount <= 0) {
      throw new InvalidAmountError("El monto a retirar debe ser un valor positivo.");
    }

    const withdrawalAmount = new Decimal(amount);

    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new AccountNotFoundError(accountId);
    }

    if (account.status === "FROZEN") {
      throw new AccountFrozenError(accountId);
    }

    if (account.balance.lessThan(withdrawalAmount)) {
      throw new InsufficientBalanceError(account.id!);
    }

    const transactionEntity = Withdrawal.create({
      amount: withdrawalAmount,
      status: "COMPLETED",
      sourceAccountId: accountId,
      createdAt: new Date(),
      description: `Retiro de ${withdrawalAmount.toNumber()} desde la cuenta ${accountId}.`,
    });

    await this.accountRepository.executeTransaction(transactionEntity);

    const updatedAccount = await this.accountRepository.findById(accountId);

    return {
      accountId,
      newBalance: updatedAccount!.balance.toNumber(),
      withdrawnAt: new Date(),
    };
  }
}
