import { DomainError } from './DomainError';

export class InsufficientBalanceError extends DomainError {
  constructor(accountId: string) {
    super(`Operación denegada: Saldo insuficiente en la cuenta [${accountId}].`);
  }
}

export class AccountFrozenError extends DomainError {
  constructor(accountId: string) {
    super(`Alerta de seguridad: La cuenta [${accountId}] se encuentra congelada.`);
  }
}

export class InvalidAmountError extends DomainError {
  constructor(message: string) {
    super(`Validación monetaria fallida: ${message}`);
  }
}

export class SameAccountTransferError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class AccountNotFoundError extends DomainError {
  constructor(accountId: string) {
    super(`La cuenta con ID ${accountId} no fue encontrada`);
  }
}

export class AccountAlreadyFrozenError extends DomainError {
  constructor(accountId: string) {
    super(`Operación denegada: La cuenta [${accountId}] ya se encuentra congelada.`);
  }
}

export class AccountNotFrozenError extends DomainError {
  constructor(accountId: string) {
    super(`Operación denegada: La cuenta [${accountId}] no está congelada y no puede ser descongelada.`);
  }
}

export class ForbiddenAccountAccessError extends DomainError {
  constructor(accountId: string) {
    super(`Acceso denegado: la cuenta [${accountId}] no pertenece al usuario autenticado.`);
  }
}