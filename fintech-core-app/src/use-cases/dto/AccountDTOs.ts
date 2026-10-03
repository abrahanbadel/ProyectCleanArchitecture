import { Decimal } from "decimal.js";

export interface CreateAccountInputDTO {
  userId: string;
  initialBalance?: number;
}

export interface GetBalanceInputDTO {
  accountId: string;
}

export interface GetUserAccountsInputDTO {
  userId: string;
}

export interface AccountOutputDTO {
  id?: string;
  accountNumber: string;
  balance: Decimal;
  status: string;
  userId: string;
  createdAt?: Date;
}

