import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DepositUseCase } from '../../src/use-cases/DepositUseCase';
import { AccountRepository } from '../../src/domain/repositories/Repositories';
import { Account } from '../../src/domain/entities/Account';
import {
  InvalidAmountError,
  AccountNotFoundError,
  AccountFrozenError,
} from '../../src/domain/exceptions/FinancialError';
import { Decimal } from 'decimal.js';

describe('DepositUseCase', () => {
  let mockAccountRepo: AccountRepository;
  let useCase: DepositUseCase;

  beforeEach(() => {
    mockAccountRepo = {
      findById: vi.fn(),
      findByAccountNumber: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      executeTransaction: vi.fn(),
    };
    useCase = new DepositUseCase(mockAccountRepo);
  });

  it('Escenario 1: Depósito exitoso incrementa el saldo y ejecuta la transacción', async () => {
    const existingAccount = Account.create({
      id: 'acc-1',
      accountNumber: 'ACC-1111',
      balance: new Decimal('100.00'),
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

  it('Escenario 2: Lanza InvalidAmountError si el monto es menor o igual a cero', async () => {
    await expect(useCase.execute({ accountId: 'acc-1', amount: 0 })).rejects.toThrow(InvalidAmountError);
    await expect(useCase.execute({ accountId: 'acc-1', amount: -25 })).rejects.toThrow(InvalidAmountError);
    expect(mockAccountRepo.executeTransaction).not.toHaveBeenCalled();
  });

  it('Escenario 3: Lanza AccountNotFoundError si la cuenta destino no existe', async () => {
    vi.mocked(mockAccountRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute({ accountId: 'acc-nonexistent', amount: 50 })).rejects.toThrow(AccountNotFoundError);
  });

  it('Escenario 4: Lanza AccountFrozenError si la cuenta está congelada', async () => {
    const frozenAccount = Account.create({
      id: 'acc-frozen',
      accountNumber: 'ACC-FROZEN',
      balance: new Decimal('50.00'),
      userId: 'user-1',
      status: 'FROZEN',
      createdAt: new Date(),
    });
    vi.mocked(mockAccountRepo.findById).mockResolvedValue(frozenAccount);

    await expect(useCase.execute({ accountId: 'acc-frozen', amount: 50 })).rejects.toThrow(AccountFrozenError);
  });
});
