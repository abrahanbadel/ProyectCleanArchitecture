import { AccountRepository } from "../domain/repositories/Repositories";
import { InvalidPropValueError } from "../domain/exceptions/DomainError";
import {
  AccountNotFoundError,
  AccountFrozenError,
  InsufficientBalanceError,
  InvalidAmountError,
} from "../domain/exceptions/FinancialError";
import { TransferMoneyInputDTO, TransferMoneyOutputDTO } from "./dto/TransferDTOs";
import { Transfer } from "../domain/entities/Transaction";
import { Decimal } from "decimal.js";

export class TransferMoneyUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: TransferMoneyInputDTO): Promise<TransferMoneyOutputDTO> {
    const { sourceAccountId, destinationAccountId, amount } = input;

    // 1. Validaciones básicas de entrada
    if (amount <= 0) {
      throw new InvalidAmountError("El monto de la transferencia debe ser estrictamente mayor a cero.");
    }

    if (sourceAccountId === destinationAccountId) {
      throw new InvalidPropValueError("La cuenta de origen y destino no pueden ser idénticas.");
    }

    const transferAmount = new Decimal(amount);

    // 2. Obtener la cuenta de origen para verificar estado e invariantes
    const sourceAccount = await this.accountRepository.findById(sourceAccountId);
    if (!sourceAccount) {
      throw new AccountNotFoundError(sourceAccountId);
    }

    // 3. Validar estado de la cuenta origen
    if (sourceAccount.status === "FROZEN") {
      throw new AccountFrozenError(sourceAccountId);
    }

    // 4. Validar invariante de saldo suficiente
    if (sourceAccount.balance.lessThan(transferAmount)) {
      throw new InsufficientBalanceError("La cuenta de origen no tiene saldo suficiente para realizar la transferencia.");
    }

    // 5. Validar existencia de la cuenta destino
    const destinationAccount = await this.accountRepository.findById(destinationAccountId);
    if (!destinationAccount) {
      throw new AccountNotFoundError(destinationAccountId);
    }

    // 6. Instanciar la Entidad de Dominio Transaction
    const transactionEntity = Transfer.create({
      amount: transferAmount,
      status: "COMPLETED",
      sourceAccountId,
      destinationAccountId,
      createdAt: new Date(),
      description: `Transferencia de ${transferAmount.toNumber()} desde la cuenta ${sourceAccountId} a la cuenta ${destinationAccountId}.`
    });

    // 7. Delegar la ejecución al repositorio pasando la entidad de dominio
    const savedTransaction = await this.accountRepository.executeTransaction(transactionEntity);

    return {
      transactionId: savedTransaction.id,
      sourceAccountId,
      destinationAccountId,
      amount: transferAmount.toNumber(),
      executedAt: new Date(),
    };
  }
}