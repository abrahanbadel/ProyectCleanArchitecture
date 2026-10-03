import { Decimal } from "decimal.js";
import { User } from "../domain/entities/User";
import { Account } from "../domain/entities/Account";
import { UserRepository, AccountRepository } from "../domain/repositories/Repositories";
import { PasswordHasher } from "../domain/services/PasswordHasher";
import { UserAlreadyExistsError } from "../domain/exceptions/UserError";
import { RegisterUserInputDTO, RegisterUserOutputDTO } from "./dto/AuthDTOs";

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly accountRepository?: AccountRepository
  ) { }

  async execute(input: RegisterUserInputDTO): Promise<RegisterUserOutputDTO> {
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new UserAlreadyExistsError(input.email);
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = await this.userRepository.save(User.create({
      id: crypto.randomUUID(),
      fullName: input.name,
      email: input.email,
      passwordHash: passwordHash,
      createdAt: new Date()
    }));

    if (this.accountRepository) {
      const initialAccount = Account.create({
        id: crypto.randomUUID(),
        accountNumber: `ACC-${Math.floor(100000000 + Math.random() * 900000000)}`,
        balance: new Decimal(0),
        userId: user.id!,
        status: "ACTIVE",
        createdAt: new Date(),
      });
      await this.accountRepository.save(initialAccount);
    }

    return {
      id: user.id!,
      name: user.fullName,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}

