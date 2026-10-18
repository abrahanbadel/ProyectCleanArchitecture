import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BalanceInquiryService } from '../../src/use-cases/GetBalanceUseCase';
import { BankAccountPersistence } from '../../src/domain/repositories/Repositories';
import {
  AccountNotFoundError,
  ForbiddenAccountAccessError,
} from '../../src/domain/exceptions/FinancialError';
import { Decimal } from 'decimal.js';
import { buildBankAccount } from '../helpers/bankAccountFactory';

const OWNER = 'user-1';

describe('BalanceInquiryService', () => {
  let bankRepo: BankAccountPersistence;
  let service: BalanceInquiryService;

  beforeEach(() => {
    bankRepo = {
      getById: vi.fn(),
      getByIban: vi.fn(),
      getByOwner: vi.fn(),
      save: vi.fn(),
      persist: vi.fn(),
      recordMovement: vi.fn(),
    };
    service = new BalanceInquiryService(bankRepo);
  });

  it('RF-2.2 Escenario 1: retorna saldo y detalle de cuenta existente', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValue(
      buildBankAccount({
        uid: 'acc-100',
        iban: 'ACC-100000001',
        currentBalance: '250.75',
        ownerId: OWNER,
      }),
    );

    const result = await service.execute({ accountId: 'acc-100' }, OWNER);

    expect(result.id).toBe('acc-100');
    expect(result.balance.equals(new Decimal('250.75'))).toBe(true);
    expect(result.status).toBe('ACTIVE');
    expect(bankRepo.getById).toHaveBeenCalledWith('acc-100');
  });

  it('RF-2.2 Escenario 2: rechaza cuenta inexistente', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValue(null);

    await expect(
      service.execute({ accountId: 'acc-not-found' }, OWNER),
    ).rejects.toThrow(AccountNotFoundError);
  });

  it('RF-2.2 Escenario 3: rechaza acceso ajeno', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValue(
      buildBankAccount({ uid: 'acc-100', ownerId: 'otro' }),
    );

    await expect(
      service.execute({ accountId: 'acc-100' }, OWNER),
    ).rejects.toThrow(ForbiddenAccountAccessError);
  });
});
