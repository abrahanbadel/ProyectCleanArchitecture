import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetBalanceUseCase } from '../../src/use-cases/GetBalanceUseCase';
import { AccountRepository } from '../../src/domain/repositories/Repositories';
import { Account } from '../../src/domain/entities/Account';
import { AccountNotFoundError } from '../../src/domain/exceptions/FinancialError';
import { Decimal } from 'decimal.js';

describe('GetBalanceUseCase', () => {
  let mockAccountRepo: AccountRepository;
  let useCase: GetBalanceUseCase;

  beforeEach(() => {
    mockAccountRepo = {
      findById: vi.fn(),
      findByAccountNumber: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      executeTransaction: vi.fn(),
    };
    useCase = new GetBalanceUseCase(mockAccountRepo);
  });

  it('Escenario 1: Retorna el saldo y detalle de una cuenta existente', async () => {
    const existingAccount = Account.create({
      id: 'acc-100',
      accountNumber: 'ACC-100000001',
      balance: new Decimal('250.75'),
      userId: 'user-1',
      status: 'ACTIVE',
      createdAt: new Date(),
    });
    vi.mocked(mockAccountRepo.findById).mockResolvedValue(existingAccount);

    const result = await useCase.execute({ accountId: 'acc-100' });

    expect(result.id).toBe('acc-100');
    expect(result.balance.equals(new Decimal('250.75'))).toBe(true);
    expect(result.status).toBe('ACTIVE');
    expect(mockAccountRepo.findById).toHaveBeenCalledWith('acc-100');
  });

  it('Escenario 2: Lanza AccountNotFoundError cuando la cuenta no existe', async () => {
    vi.mocked(mockAccountRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute({ accountId: 'acc-not-found' })).rejects.toThrow(AccountNotFoundError);
  });
});
