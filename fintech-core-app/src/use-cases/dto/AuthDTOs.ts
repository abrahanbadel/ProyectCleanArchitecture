/** Credenciales de acceso JWT (RF-1.2). */
export type UserLoginRequest = {
  readonly email: string;
  readonly password: string;
};

export type UserLoginResponse = {
  readonly token: string;
  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
  };
};

/** Alta de titular con cuenta inicial (RF-1.1). */
export type UserRegistrationRequest = {
  readonly email: string;
  readonly password: string;
  readonly name: string;
};

export type UserRegistrationResponse = {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly createdAt: Date;
};
