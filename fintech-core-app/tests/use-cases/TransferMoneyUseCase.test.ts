import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransferMoneyUseCase } from '../../src/use-cases/TransferMoneyUseCase';
import { AccountRepository } from '../../src/domain/repositories/Repositories';
import { Account } from '../../src/domain/entities/Account';
import { Transfer } from '../../src/domain/entities/Transaction';
import {
  InvalidAmountError,
  AccountNotFoundError,
  AccountFrozenError,
  InsufficientBalanceError,
} from '../../src/domain/exceptions/FinancialError';
import { InvalidPropValueError } from '../../src/domain/exceptions/DomainError';
import { Decimal } from 'decimal.js';

describe('TransferMoneyUseCase', () => {
  let mockAccountRepo: AccountRepository;
  let useCase: TransferMoneyUseCase;

  beforeEach(() => {
    mockAccountRepo = {
      findById: vi.fn(),
      findByAccountNumber: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      executeTransaction: vi.fn(),
    };
    useCase = new TransferMoneyUseCase(mockAccountRepo);
  });

  it('Escenario 1: Transferencia exitosa entre dos cuentas existentes y activas', async () => {
    const source = Account.create({
      id: 'acc-source',
      accountNumber: 'ACC-1111',
      balance: new Decimal('500.00'),
      userId: 'user-1',
      status: 'ACTIVE',
      createdAt: new Date(),
    });

    const destination = Account.create({
      id: 'acc-dest',
      accountNumber: 'ACC-2222',
      balance: new Decimal('100.00'),
      userId: 'user-2',
      status: 'ACTIVE',
      createdAt: new Date(),
    });

    vi.mocked(mockAccountRepo.findById)
      .mockResolvedValueOnce(source)
      .mockResolvedValueOnce(destination);

    const createdTx = Transfer.create({
      id: 'tx-123',
      amount: new Decimal('150.00'),
      status: 'COMPLETED',
      sourceAccountId: 'acc-source',
      destinationAccountId: 'acc-dest',
      description: 'Test transfer',
      createdAt: new Date(),
    });
    vi.mocked(mockAccountRepo.executeTransaction).mockResolvedValue(createdTx);

    const result = await useCase.execute({
      sourceAccountId: 'acc-source',
      destinationAccountId: 'acc-dest',
      amount: 150.00,
    });

    expect(result.transactionId).toBe('tx-123');
    expect(result.sourceAccountId).toBe('acc-source');
    expect(result.destinationAccountId).toBe('acc-dest');
    expect(result.amount).toBe(150.00);
    expect(mockAccountRepo.executeTransaction).toHaveBeenCalledOnce();
  });

  it('Escenario 2: Rechaza si el monto es <= 0', async () => {
    await expect(
      useCase.execute({ sourceAccountId: 'acc-1', destinationAccountId: 'acc-2', amount: 0 })
    ).rejects.toThrow(InvalidAmountError);

    await expect(
      useCase.execute({ sourceAccountId: 'acc-1', destinationAccountId: 'acc-2', amount: -50 })
    ).rejects.toThrow(InvalidAmountError);
  });

  it('Escenario 3: Rechaza si la cuenta origen y destino son la misma', async () => {
    await expect(
      useCase.execute({ sourceAccountId: 'acc-1', destinationAccountId: 'acc-1', amount: 50 })
    ).rejects.toThrow(InvalidPropValueError);
  });

  it('Escenario 4: Rechaza si la cuenta origen no existe', async () => {
    vi.mocked(mockAccountRepo.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute({ sourceAccountId: 'acc-404', destinationAccountId: 'acc-2', amount: 50 })
    ).rejects.toThrow(AccountNotFoundError);
  });

  it('Escenario 5: Rechaza si la cuenta origen está congelada', async () => {
    const frozenSource = Account.create({
      id: 'acc-frozen',
      accountNumber: 'ACC-FROZEN',
      balance: new Decimal('1000.00'),
      userId: 'user-1',
      status: 'FROZEN',
      createdAt: new Date(),
    });
    vi.mocked(mockAccountRepo.findById).mockResolvedValueOnce(frozenSource);

    await expect(
      useCase.execute({ sourceAccountId: 'acc-frozen', destinationAccountId: 'acc-2', amount: 50 })
    ).rejects.toThrow(AccountFrozenError);
  });

  it('Escenario 6: Rechaza con InsufficientBalanceError si saldo es menor al monto', async () => {
    const poorSource = Account.create({
      id: 'acc-poor',
      accountNumber: 'ACC-POOR',
      balance: new Decimal('20.00'),
      userId: 'user-1',
      status: 'ACTIVE',
      createdAt: new Date(),
    });
    vi.mocked(mockAccountRepo.findById).mockResolvedValueOnce(poorSource);

    await expect(
      useCase.execute({ sourceAccountId: 'acc-poor', destinationAccountId: 'acc-2', amount: 100 })
    ).rejects.toThrow(InsufficientBalanceError);
  });

  it('Escenario 7: Rechaza si la cuenta destino no existe', async () => {
    const source = Account.create({
      id: 'acc-source',
      accountNumber: 'ACC-1111',
      balance: new Decimal('500.00'),
      userId: 'user-1',
      status: 'ACTIVE',
      createdAt: new Date(),
    });
    vi.mocked(mockAccountRepo.findById)
      .mockResolvedValueOnce(source)
      .mockResolvedValueOnce(null);

    await expect(
      useCase.execute({ sourceAccountId: 'acc-source', destinationAccountId: 'acc-404', amount: 50 })
    ).rejects.toThrow(AccountNotFoundError);
  });
});
