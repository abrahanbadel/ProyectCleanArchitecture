import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FreezeAccountUseCase } from '../../src/use-cases/FreezeAccountUseCase';
import { AccountRepository } from '../../src/domain/repositories/Repositories';
import { Account } from '../../src/domain/entities/Account';
import {
  AccountAlreadyFrozenError,
  AccountNotFoundError,
} from '../../src/domain/exceptions/FinancialError';
import { Decimal } from 'decimal.js';

describe('FreezeAccountUseCase', () => {
  let mockAccountRepo: AccountRepository;
  let useCase: FreezeAccountUseCase;

  beforeEach(() => {
    mockAccountRepo = {
      findById: vi.fn(),
      findByAccountNumber: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      executeTransaction: vi.fn(),
    };
    useCase = new FreezeAccountUseCase(mockAccountRepo);
  });

  it('Escenario 1: Congelar una cuenta activa cambia su estado a FROZEN y actualiza el repositorio', async () => {
    const activeAccount = Account.create({
      id: 'acc-1',
      accountNumber: 'ACC-1111',
      balance: new Decimal('100.00'),
      userId: 'user-1',
      status: 'ACTIVE',
      createdAt: new Date(),
    });
    vi.mocked(mockAccountRepo.findById).mockResolvedValue(activeAccount);

    await useCase.execute('acc-1');

    expect(activeAccount.status).toBe('FROZEN');
    expect(mockAccountRepo.update).toHaveBeenCalledWith(activeAccount);
  });

  it('Escenario 2: Lanza AccountAlreadyFrozenError si la cuenta ya está congelada', async () => {
    const frozenAccount = Account.create({
      id: 'acc-1',
      accountNumber: 'ACC-1111',
      balance: new Decimal('100.00'),
      userId: 'user-1',
      status: 'FROZEN',
      createdAt: new Date(),
    });
    vi.mocked(mockAccountRepo.findById).mockResolvedValue(frozenAccount);

    await expect(useCase.execute('acc-1')).rejects.toThrow(AccountAlreadyFrozenError);
    expect(mockAccountRepo.update).not.toHaveBeenCalled();
  });

  it('Escenario 3: Lanza AccountNotFoundError si la cuenta no existe', async () => {
    vi.mocked(mockAccountRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute('acc-unknown')).rejects.toThrow(AccountNotFoundError);
  });
});
