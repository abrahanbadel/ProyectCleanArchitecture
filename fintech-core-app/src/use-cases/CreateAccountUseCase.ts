import { BankAccountPersistence } from "../domain/repositories/Repositories";
import { Decimal } from "decimal.js";
import { BankAccount } from "../domain/entities/Account";
import { CreateAccountInputDTO, AccountOutputDTO } from "./dto/AccountDTOs";
import { InvalidAmountError } from "../domain/exceptions/FinancialError";

export class AccountCreationService {
  constructor(private readonly bankRepo: BankAccountPersistence) { }

  async execute(payload: CreateAccountInputDTO): Promise<AccountOutputDTO> {
    const startBalance = payload.initialBalance ?? 0;

    if (startBalance < 0) {
      throw new InvalidAmountError("El monto de la operación debe ser un valor estricto mayor a cero.");
    }

    const iban = `ACC-${Math.floor(100000000 + Math.random() * 900000000)}`;

    const newAccount = BankAccount.initialize({
      uid: crypto.randomUUID(),
      iban,
      currentBalance: new Decimal(startBalance),
      ownerId: payload.userId,
      accountStatus: "ACTIVE",
      openedAt: new Date()
    });

    await this.bankRepo.save(newAccount);

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
