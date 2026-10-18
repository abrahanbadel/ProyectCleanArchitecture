import { Decimal } from 'decimal.js';
import { BankAccountPersistence } from '../domain/repositories/Repositories';
import { InvalidPropValueError } from '../domain/exceptions/DomainError';
import {
  AccountNotFoundError,
  ForbiddenAccountAccessError,
  InvalidAmountError,
} from '../domain/exceptions/FinancialError';
import { TransferMoneyInputDTO, TransferMoneyOutputDTO } from './dto/TransferDTOs';
import { Transfer } from '../domain/entities/Transaction';

export class TransferFundsService {
  constructor(private readonly bankRepo: BankAccountPersistence) {}

  async execute(
    payload: TransferMoneyInputDTO,
    requesterId: string,
  ): Promise<TransferMoneyOutputDTO> {
    const { sourceAccountId, destinationAccountNumber, amount } = payload;

    if (amount <= 0) {
      throw new InvalidAmountError(
        'El monto de la transferencia debe ser estrictamente mayor a cero.',
      );
    }

    if (!destinationAccountNumber) {
      throw new InvalidPropValueError('El número de cuenta de destino es requerido.');
    }

    const source = await this.bankRepo.getById(sourceAccountId);
    if (!source) {
      throw new AccountNotFoundError(sourceAccountId);
    }
    if (source.userId !== requesterId) {
      throw new ForbiddenAccountAccessError(sourceAccountId);
    }

    // Resolver número de cuenta de destino al ID interno (UUID)
    const destination = await this.bankRepo.getByIban(destinationAccountNumber);
    if (!destination) {
      throw new AccountNotFoundError(destinationAccountNumber);
    }

    const destinationAccountId = destination.id;

    if (sourceAccountId === destinationAccountId) {
      throw new InvalidPropValueError('La cuenta de origen y destino no pueden ser idénticas.');
    }

    const volume = new Decimal(amount);
    const movement = Transfer.create({
      value: volume,
      txStatus: 'COMPLETED',
      originAccount: sourceAccountId,
      targetAccount: destinationAccountId,
      timestamp: new Date(),
      note: `Transferencia de ${volume.toFixed(4)} desde ${sourceAccountId} hacia ${destinationAccountId}.`,
    });

    // Invariantes de saldo/congelada viven en BankAccount; se aplican dentro de recordMovement (con lock).
    const processedTx = await this.bankRepo.recordMovement(movement);

    return {
      transactionId: processedTx.id,
      sourceAccountId,
      destinationAccountId,
      amount: Number(volume.toString()),
      executedAt: new Date(),
    };
  }
}
