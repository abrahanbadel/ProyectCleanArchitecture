export type MovementKind = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';

export type MovementLifecycle = 'PENDING' | 'COMPLETED' | 'FAILED';

/** Consulta de movimientos de una cuenta (RF-3.4). */
export type MovementHistoryRequest = {
  readonly accountId: string;
};

export type MovementLedgerItem = {
  readonly id: string;
  readonly type: MovementKind;
  readonly amount: number;
  readonly status: MovementLifecycle;
  readonly description: string;
  readonly createdAt: Date;
  readonly sourceAccountId?: string;
  readonly destinationAccountId?: string;
};

export type MovementHistoryResponse = {
  readonly accountId: string;
  readonly transactions: MovementLedgerItem[];
};
