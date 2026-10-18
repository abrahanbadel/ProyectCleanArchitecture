import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountFreezeService } from '../../src/use-cases/FreezeAccountUseCase';
import { BankAccountPersistence } from '../../src/domain/repositories/Repositories';
import {
  AccountAlreadyFrozenError,
  AccountNotFoundError,
  ForbiddenAccountAccessError,
} from '../../src/domain/exceptions/FinancialError';
import { buildBankAccount } from '../helpers/bankAccountFactory';

const OWNER = 'user-1';

describe('AccountFreezeService', () => {
  let bankRepo: BankAccountPersistence;
  let service: AccountFreezeService;

  beforeEach(() => {
    bankRepo = {
      getById: vi.fn(),
      getByIban: vi.fn(),
      getByOwner: vi.fn(),
      save: vi.fn(),
      persist: vi.fn().mockResolvedValue(undefined),
      recordMovement: vi.fn(),
    };
    service = new AccountFreezeService(bankRepo);
  });

  it('Congela una cuenta activa y persiste el estado', async () => {
    const active = buildBankAccount({ accountStatus: 'ACTIVE', ownerId: OWNER });
    vi.mocked(bankRepo.getById).mockResolvedValue(active);

    await service.execute('acc-1', OWNER);

    expect(active.status).toBe('FROZEN');
    expect(bankRepo.persist).toHaveBeenCalledWith(active);
  });

  it('Rechaza si la cuenta ya está congelada', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValue(
      buildBankAccount({ accountStatus: 'FROZEN', ownerId: OWNER }),
    );

    await expect(service.execute('acc-1', OWNER)).rejects.toThrow(AccountAlreadyFrozenError);
    expect(bankRepo.persist).not.toHaveBeenCalled();
  });

  it('Rechaza si la cuenta no existe', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValue(null);

    await expect(service.execute('acc-unknown', OWNER)).rejects.toThrow(AccountNotFoundError);
  });

  it('Rechaza acceso ajeno', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValue(
      buildBankAccount({ accountStatus: 'ACTIVE', ownerId: 'otro' }),
    );

    await expect(service.execute('acc-1', OWNER)).rejects.toThrow(ForbiddenAccountAccessError);
  });
});
