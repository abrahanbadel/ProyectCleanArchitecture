import { InvalidPropValueError } from '../exceptions/DomainError';

export interface UserProps {
  id?: string;
  email: string;
  passwordHash: string;
  fullName: string;
  createdAt: Date;
}

export class User {
  private readonly props: UserProps;

  private constructor(props: UserProps) {
    this.props = props;
  }

  public static create(props: UserProps): User {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(props.email)) {
      throw new InvalidPropValueError(
        `El formato del correo electrónico es inválido: ${props.email}`,
      );
    }

    return new User(props);
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
