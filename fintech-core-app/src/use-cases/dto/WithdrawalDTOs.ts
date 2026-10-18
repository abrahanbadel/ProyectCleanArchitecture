/** Solicitud de débito desde cuenta (RF-3.2). */
export type CashWithdrawalRequest = {
  readonly accountId: string;
  readonly amount: number;
};

export type CashWithdrawalResponse = {
  readonly accountId: string;
  readonly newBalance: number;
  readonly withdrawnAt: Date;
};
