import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WithdrawalUseCase } from '../../src/use-cases/WithdrawalUseCase';
import { AccountRepository } from '../../src/domain/repositories/Repositories';
import { Account } from '../../src/domain/entities/Account';
import {
  InvalidAmountError,
  AccountNotFoundError,
  AccountFrozenError,
  InsufficientBalanceError,
} from '../../src/domain/exceptions/FinancialError';
import { Decimal } from 'decimal.js';

describe('WithdrawalUseCase', () => {
  let mockAccountRepo: AccountRepository;
  let useCase: WithdrawalUseCase;

  beforeEach(() => {
    mockAccountRepo = {
      findById: vi.fn(),
      findByAccountNumber: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      executeTransaction: vi.fn(),
    };
    useCase = new WithdrawalUseCase(mockAccountRepo);
  });

  it('Escenario 1: Retiro exitoso decrementa saldo y ejecuta transacción', async () => {
    const existingAccount = Account.create({
      id: 'acc-1',
      accountNumber: 'ACC-1111',
      balance: new Decimal('200.00'),
      userId: 'user-1',
      status: 'ACTIVE',
      createdAt: new Date(),
    });

    const updatedAccount = Account.create({
      id: 'acc-1',
      accountNumber: 'ACC-1111',
      balance: new Decimal('150.00'),
      userId: 'user-1',
      status: 'ACTIVE',
      createdAt: new Date(),
    });

    vi.mocked(mockAccountRepo.findById)
      .mockResolvedValueOnce(existingAccount)
      .mockResolvedValueOnce(updatedAccount);
    vi.mocked(mockAccountRepo.executeTransaction).mockResolvedValue({} as any);

    const result = await useCase.execute({ accountId: 'acc-1', amount: 50.00 });

    expect(result.accountId).toBe('acc-1');
    expect(result.newBalance).toBe(150.00);
    expect(mockAccountRepo.executeTransaction).toHaveBeenCalledOnce();
  });

  it('Escenario 2: Lanza InsufficientBalanceError si el monto solicitado excede el saldo', async () => {
    const existingAccount = Account.create({
      id: 'acc-1',
      accountNumber: 'ACC-1111',
      balance: new Decimal('30.00'),
      userId: 'user-1',
      status: 'ACTIVE',
      createdAt: new Date(),
    });
    vi.mocked(mockAccountRepo.findById).mockResolvedValue(existingAccount);

    await expect(useCase.execute({ accountId: 'acc-1', amount: 100.00 })).rejects.toThrow(InsufficientBalanceError);
    expect(mockAccountRepo.executeTransaction).not.toHaveBeenCalled();
  });

  it('Escenario 3: Lanza AccountFrozenError si la cuenta origen está congelada', async () => {
    const frozenAccount = Account.create({
      id: 'acc-frozen',
      accountNumber: 'ACC-FROZEN',
      balance: new Decimal('500.00'),
      userId: 'user-1',
      status: 'FROZEN',
      createdAt: new Date(),
    });
    vi.mocked(mockAccountRepo.findById).mockResolvedValue(frozenAccount);

    await expect(useCase.execute({ accountId: 'acc-frozen', amount: 50.00 })).rejects.toThrow(AccountFrozenError);
  });

  it('Escenario 4: Lanza InvalidAmountError si el monto es <= 0', async () => {
    await expect(useCase.execute({ accountId: 'acc-1', amount: 0 })).rejects.toThrow(InvalidAmountError);
    await expect(useCase.execute({ accountId: 'acc-1', amount: -10 })).rejects.toThrow(InvalidAmountError);
  });

  it('Escenario 5: Lanza AccountNotFoundError si la cuenta no existe', async () => {
    vi.mocked(mockAccountRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute({ accountId: 'acc-unknown', amount: 50 })).rejects.toThrow(AccountNotFoundError);
  });
});
