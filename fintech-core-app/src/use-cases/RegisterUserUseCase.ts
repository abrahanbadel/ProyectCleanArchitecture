import { Decimal } from "decimal.js";
import { User } from "../domain/entities/User";
import { BankAccount } from "../domain/entities/Account";
import { UserPersistence, BankAccountPersistence } from "../domain/repositories/Repositories";
import { PasswordHasher } from "../domain/services/PasswordHasher";
import { UserAlreadyExistsError } from "../domain/exceptions/UserError";
import { UserRegistrationRequest, UserRegistrationResponse } from "./dto/AuthDTOs";

export class UserRegistrationService {
  constructor(
    private readonly userRepo: UserPersistence,
    private readonly pwdHasher: PasswordHasher,
    private readonly bankRepo?: BankAccountPersistence
  ) { }

  async execute(payload: UserRegistrationRequest): Promise<UserRegistrationResponse> {
    const userExists = await this.userRepo.getByEmail(payload.email);

    if (userExists) {
      throw new UserAlreadyExistsError(payload.email);
    }

    const encryptedPassword = await this.pwdHasher.hash(payload.password);

    const newUser = await this.userRepo.upsert(User.create({
      id: crypto.randomUUID(),
      fullName: payload.name,
      email: payload.email,
      passwordHash: encryptedPassword,
      createdAt: new Date()
    }));

    if (this.bankRepo) {
      const welcomeAccount = BankAccount.initialize({
        uid: crypto.randomUUID(),
        iban: `ACC-${Math.floor(100000000 + Math.random() * 900000000)}`,
        currentBalance: new Decimal(0),
        ownerId: newUser.id!,
        accountStatus: "ACTIVE",
        openedAt: new Date(),
      });
      await this.bankRepo.save(welcomeAccount);
    }

    return {
      id: newUser.id!,
      name: newUser.fullName,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };
  }
}
