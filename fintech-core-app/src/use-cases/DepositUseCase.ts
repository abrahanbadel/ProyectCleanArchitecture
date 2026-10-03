import { AccountRepository } from "../domain/repositories/Repositories";
import { InvalidAmountError, AccountNotFoundError, AccountFrozenError } from "../domain/exceptions/FinancialError";
import { DepositInputDTO, DepositOutputDTO } from "./dto/DepositDTOs";
import { Deposit } from "../domain/entities/Transaction";
import { Decimal } from "decimal.js";

export class DepositUseCase {
  constructor(private readonly accountRepository: AccountRepository) { }

  async execute(input: DepositInputDTO): Promise<DepositOutputDTO> {
    const { accountId, amount } = input;

    if (amount <= 0) {
      throw new InvalidAmountError("El monto a depositar debe ser un valor positivo.");
    }

    const depositAmount = new Decimal(amount);

    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new AccountNotFoundError(accountId);
    }

    if (account.status === "FROZEN") {
      throw new AccountFrozenError(accountId);
    }

    const transactionEntity = Deposit.create({
      amount: depositAmount,
      status: "COMPLETED",
      destinationAccountId: accountId,
      createdAt: new Date(),
      description: `Depósito de ${depositAmount.toNumber()} a la cuenta ${accountId}.`,
    });

    await this.accountRepository.executeTransaction(transactionEntity);

    const updatedAccount = await this.accountRepository.findById(accountId);

    return {
      accountId,
      newBalance: updatedAccount!.balance.toNumber(),
      depositedAt: new Date(),
    };
  }
}
