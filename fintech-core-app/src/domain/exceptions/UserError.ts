import { DomainError } from "./DomainError";

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`El usuario con el correo ${email} ya existe.`);
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor(message: string = 'Credenciales inválidas.') {
    super(message);
  }
}
