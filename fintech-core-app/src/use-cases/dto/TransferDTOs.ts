export interface TransferMoneyInputDTO {
    sourceAccountId: string;
    /** Número de cuenta IBAN de la cuenta destino (no el UUID interno). */
    destinationAccountNumber: string;
    amount: number;
  }
  
  export interface TransferMoneyOutputDTO {
    transactionId: string;
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    executedAt: Date;
  }