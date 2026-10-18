import { UserPersistence } from "../domain/repositories/Repositories";
import { PasswordHasher } from "../domain/services/PasswordHasher";
import { TokenService } from "../domain/services/TokenService";
import { InvalidCredentialsError } from "../domain/exceptions/UserError";
import { UserLoginRequest, UserLoginResponse } from "./dto/AuthDTOs";

export class UserLoginService {
  constructor(
    private readonly userRepo: UserPersistence,
    private readonly tokenProvider: TokenService,
    private readonly pwdHasher: PasswordHasher
  ) { }

  async execute(credentials: UserLoginRequest): Promise<UserLoginResponse> {
    const accountHolder = await this.userRepo.getByEmail(credentials.email);

    if (!accountHolder) {
      throw new InvalidCredentialsError('Credenciales inválidas.');
    }

    const isMatch = await this.pwdHasher.compare(credentials.password, accountHolder.passwordHash);

    if (!isMatch) {
      throw new InvalidCredentialsError('Credenciales inválidas.');
    }

    const authToken = this.tokenProvider.generateToken({
      userId: accountHolder.id!,
      email: accountHolder.email
    });

    return {
      token: authToken,
      user: {
        id: accountHolder.id!,
        name: accountHolder.fullName,
        email: accountHolder.email,
      },
    };
  }
}
