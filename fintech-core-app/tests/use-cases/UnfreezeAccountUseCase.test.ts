import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnfreezeAccountUseCase } from '../../src/use-cases/UnfreezeAccountUseCase';
import { AccountRepository } from '../../src/domain/repositories/Repositories';
import { Account } from '../../src/domain/entities/Account';
import {
  AccountNotFrozenError,
  AccountNotFoundError,
} from '../../src/domain/exceptions/FinancialError';
import { Decimal } from 'decimal.js';

describe('UnfreezeAccountUseCase', () => {
  let mockAccountRepo: AccountRepository;
  let useCase: UnfreezeAccountUseCase;

  beforeEach(() => {
    mockAccountRepo = {
      findById: vi.fn(),
      findByAccountNumber: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      executeTransaction: vi.fn(),
    };
    useCase = new UnfreezeAccountUseCase(mockAccountRepo);
  });

  it('Escenario 1: Descongelar una cuenta congelada cambia su estado a ACTIVE y persiste', async () => {
    const frozenAccount = Account.create({
      id: 'acc-1',
      accountNumber: 'ACC-1111',
      balance: new Decimal('100.00'),
      userId: 'user-1',
      status: 'FROZEN',
      createdAt: new Date(),
    });
    vi.mocked(mockAccountRepo.findById).mockResolvedValue(frozenAccount);

    await useCase.execute('acc-1');

    expect(frozenAccount.status).toBe('ACTIVE');
    expect(mockAccountRepo.update).toHaveBeenCalledWith(frozenAccount);
  });

  it('Escenario 2: Lanza AccountNotFrozenError si la cuenta ya está activa', async () => {
    const activeAccount = Account.create({
      id: 'acc-1',
      accountNumber: 'ACC-1111',
      balance: new Decimal('100.00'),
      userId: 'user-1',
      status: 'ACTIVE',
      createdAt: new Date(),
    });
    vi.mocked(mockAccountRepo.findById).mockResolvedValue(activeAccount);

    await expect(useCase.execute('acc-1')).rejects.toThrow(AccountNotFrozenError);
    expect(mockAccountRepo.update).not.toHaveBeenCalled();
  });

  it('Escenario 3: Lanza AccountNotFoundError si la cuenta no existe', async () => {
    vi.mocked(mockAccountRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute('acc-unknown')).rejects.toThrow(AccountNotFoundError);
  });
});
