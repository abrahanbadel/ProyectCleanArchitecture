import { Decimal } from 'decimal.js';
import { InvalidAmountError, SameAccountTransferError } from '../exceptions/FinancialError';

export type MovementStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface MovementProps {
  txId: string;
  value: Decimal;
  txStatus: MovementStatus;
  note: string;
  timestamp: Date;
}

export interface DepositData extends Omit<MovementProps, 'txId'> {
  txId?: string;
  targetAccount: string;
}

export interface WithdrawalData extends Omit<MovementProps, 'txId'> {
  txId?: string;
  originAccount: string;
}

export interface TransferData extends Omit<MovementProps, 'txId'> {
  txId?: string;
  originAccount: string;
  targetAccount: string;
}

export abstract class FinancialMovement {
  protected state: MovementProps;

  protected constructor(props: MovementProps) {
    if (props.value.lte(0)) {
        throw new InvalidAmountError("El monto de la operación debe ser superior a cero.");
    }
    this.state = props;
  }

  get id(): string { return this.state.txId; }
  get amount(): Decimal { return this.state.value; }
  get status(): MovementStatus { return this.state.txStatus; }
  get description(): string { return this.state.note; }
  get createdAt(): Date { return this.state.timestamp; }

  public confirm(): void {
    this.state.txStatus = 'COMPLETED';
  }

  public fail(): void {
    this.state.txStatus = 'FAILED';
  }

  abstract process(): void;
}

export class Deposit extends FinancialMovement {
  private targetId: string;

  private constructor(props: MovementProps, targetId: string) {
    super(props);
    this.targetId = targetId;
  }

  public static create(props: DepositData): Deposit {
    const { targetAccount, txId, ...rest } = props;
    return new Deposit({
      ...rest,
      txId: txId ?? crypto.randomUUID(),
    }, targetAccount);
  }

  get destinationAccount(): string { return this.targetId; }

  process(): void {
    this.confirm();
  }
}

export class Withdrawal extends FinancialMovement {
  private originId: string;

  private constructor(props: MovementProps, originId: string) {
    super(props);
    this.originId = originId;
  }

  public static create(props: WithdrawalData): Withdrawal {
    const { originAccount, txId, ...rest } = props;
    return new Withdrawal({
      ...rest,
      txId: txId ?? crypto.randomUUID(),
    }, originAccount);
  }

  get sourceAccount(): string { return this.originId; }

  process(): void {
    this.confirm();
  }
}

export class Transfer extends FinancialMovement {
  private originId: string;
  private targetId: string;

  private constructor(props: MovementProps, originId: string, targetId: string) {
    super(props);
    if (originId === targetId) {
        throw new SameAccountTransferError("No se pueden realizar transferencias entre la misma cuenta.");
    }
    this.originId = originId;
    this.targetId = targetId;
  }

  public static create(props: TransferData): Transfer {
    const { originAccount, targetAccount, txId, ...rest } = props;
    return new Transfer({
      ...rest,
      txId: txId ?? crypto.randomUUID(),
    }, originAccount, targetAccount);
  }

  get sourceAccount(): string { return this.originId; }
  get destinationAccount(): string { return this.targetId; }

  process(): void {
    this.confirm();
  }
}
