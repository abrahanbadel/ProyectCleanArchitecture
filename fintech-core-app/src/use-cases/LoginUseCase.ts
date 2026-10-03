import { UserRepository } from "../domain/repositories/Repositories";
import { PasswordHasher } from "../domain/services/PasswordHasher";
import { TokenService } from "../domain/services/TokenService";
import { InvalidCredentialsError } from "../domain/exceptions/UserError";
import { LoginInputDTO, LoginOutputDTO } from "./dto/AuthDTOs";

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly passwordHasher: PasswordHasher
  ) { }

  async execute(input: LoginInputDTO): Promise<LoginOutputDTO> {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      throw new InvalidCredentialsError('Credenciales inválidas.');
    }

    const isPasswordValid = await this.passwordHasher.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new InvalidCredentialsError('Credenciales inválidas.');
    }

    const token = this.tokenService.generateToken({ userId: user.id!, email: user.email });

    return {
      token,
      user: {
        id: user.id!,
        name: user.fullName,
        email: user.email,
      },
    };
  }
}