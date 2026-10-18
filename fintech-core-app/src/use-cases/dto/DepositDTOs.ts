/** Solicitud de abono a cuenta (RF-3.1). */
export type FundDepositRequest = {
  readonly accountId: string;
  readonly amount: number;
};

export type FundDepositResponse = {
  readonly accountId: string;
  readonly newBalance: number;
  readonly depositedAt: Date;
};
