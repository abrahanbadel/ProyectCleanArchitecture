export interface WithdrawalInputDTO {
  accountId: string;
  amount: number;
}

export interface WithdrawalOutputDTO {
  accountId: string;
  newBalance: number;
  withdrawnAt: Date;
}
