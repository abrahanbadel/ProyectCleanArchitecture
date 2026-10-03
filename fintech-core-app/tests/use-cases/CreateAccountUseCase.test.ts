import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateAccountUseCase } from '../../src/use-cases/CreateAccountUseCase';
import { AccountRepository } from '../../src/domain/repositories/Repositories';
import { InvalidAmountError } from '../../src/domain/exceptions/FinancialError';
import { Decimal } from 'decimal.js';

describe('CreateAccountUseCase', () => {
  let mockAccountRepo: AccountRepository;
  let useCase: CreateAccountUseCase;

  beforeEach(() => {
    mockAccountRepo = {
      findById: vi.fn(),
      findByAccountNumber: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      executeTransaction: vi.fn(),
    };
    useCase = new CreateAccountUseCase(mockAccountRepo);
  });

  it('Escenario 1: Creación exitosa con balance inicial mayor a cero', async () => {
    const input = { userId: 'user-123', initialBalance: 150.50 };
    const result = await useCase.execute(input);

    expect(result).toBeDefined();
    expect(result.userId).toBe('user-123');
    expect(result.balance.equals(new Decimal(150.50))).toBe(true);
    expect(result.status).toBe('ACTIVE');
    expect(result.accountNumber).toMatch(/^ACC-\d+/);
    expect(mockAccountRepo.save).toHaveBeenCalledOnce();
  });

  it('Escenario 2: Creación exitosa sin balance inicial (por defecto 0)', async () => {
    const input = { userId: 'user-456' };
    const result = await useCase.execute(input);

    expect(result).toBeDefined();
    expect(result.userId).toBe('user-456');
    expect(result.balance.equals(new Decimal(0))).toBe(true);
    expect(result.status).toBe('ACTIVE');
    expect(mockAccountRepo.save).toHaveBeenCalledOnce();
  });

  it('Escenario 3: Rechaza la creación si el monto inicial es negativo', async () => {
    const input = { userId: 'user-789', initialBalance: -50 };

    await expect(useCase.execute(input)).rejects.toThrow(InvalidAmountError);
    expect(mockAccountRepo.save).not.toHaveBeenCalled();
  });
});
