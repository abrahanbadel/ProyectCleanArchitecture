export interface DepositInputDTO {
  accountId: string;
  amount: number;
}

export interface DepositOutputDTO {
  accountId: string;
  newBalance: number;
  depositedAt: Date;
}
