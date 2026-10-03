import { AccountRepository } from "../domain/repositories/Repositories";
import { Decimal } from "decimal.js";
import { Account } from "../domain/entities/Account";
import { CreateAccountInputDTO, AccountOutputDTO } from "./dto/AccountDTOs";
import { InvalidAmountError } from "../domain/exceptions/FinancialError";

export class CreateAccountUseCase {
  constructor(private readonly accountRepository: AccountRepository) { }

  async execute(input: CreateAccountInputDTO): Promise<AccountOutputDTO> {
    const initialAmount = input.initialBalance ?? 0;

    if (initialAmount < 0) {
      throw new InvalidAmountError("El monto de la operación debe ser un valor estricto mayor a cero.");
    }

    const accountNumber = `ACC-${Math.floor(100000000 + Math.random() * 900000000)}`;

    const newAccount = Account.create({
      id: crypto.randomUUID(),
      accountNumber,
      balance: new Decimal(initialAmount),
      userId: input.userId,
      status: "ACTIVE",
      createdAt: new Date()
    });

    await this.accountRepository.save(newAccount);
    
    return {
      id: newAccount.id,
      accountNumber: newAccount.accountNumber,
      balance: newAccount.balance,
      status: newAccount.status,
      userId: newAccount.userId,
      createdAt: newAccount.createdAt,
    };
  }
}