export interface GetTransactionHistoryInputDTO {
    accountId: string;
  }
  
  export interface TransactionHistoryItemDTO {
    id: string;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
    amount: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    description: string;
    createdAt: Date;
    sourceAccountId?: string;
    destinationAccountId?: string;
  }
  
  export interface GetTransactionHistoryOutputDTO {
    accountId: string;
    transactions: TransactionHistoryItemDTO[];
  }