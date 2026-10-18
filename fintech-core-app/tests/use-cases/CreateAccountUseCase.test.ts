import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountCreationService } from '../../src/use-cases/CreateAccountUseCase';
import { BankAccountPersistence } from '../../src/domain/repositories/Repositories';
import { InvalidAmountError } from '../../src/domain/exceptions/FinancialError';
import { Decimal } from 'decimal.js';

describe('AccountCreationService', () => {
  let bankRepo: BankAccountPersistence;
  let service: AccountCreationService;

  beforeEach(() => {
    bankRepo = {
      getById: vi.fn(),
      getByIban: vi.fn(),
      getByOwner: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      persist: vi.fn(),
      recordMovement: vi.fn(),
    };
    service = new AccountCreationService(bankRepo);
  });

  it('RF-2.1 Escenario 1: crea cuenta con saldo inicial positivo', async () => {
    const result = await service.execute({ userId: 'user-123', initialBalance: 150.5 });

    expect(result.userId).toBe('user-123');
    expect(result.balance.equals(new Decimal(150.5))).toBe(true);
    expect(result.status).toBe('ACTIVE');
    expect(result.accountNumber).toMatch(/^ACC-\d+/);
    expect(bankRepo.save).toHaveBeenCalledOnce();
  });

  it('RF-2.1 Escenario 2: crea cuenta con saldo inicial 0 por defecto', async () => {
    const result = await service.execute({ userId: 'user-456' });

    expect(result.userId).toBe('user-456');
    expect(result.balance.equals(new Decimal(0))).toBe(true);
    expect(result.status).toBe('ACTIVE');
    expect(bankRepo.save).toHaveBeenCalledOnce();
  });

  it('RF-2.1 Escenario 3: rechaza saldo inicial negativo', async () => {
    await expect(
      service.execute({ userId: 'user-789', initialBalance: -50 }),
    ).rejects.toThrow(InvalidAmountError);
    expect(bankRepo.save).not.toHaveBeenCalled();
  });
});
