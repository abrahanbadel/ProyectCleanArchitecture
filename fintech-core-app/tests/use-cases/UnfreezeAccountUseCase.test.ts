import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountReactivationService } from '../../src/use-cases/UnfreezeAccountUseCase';
import { BankAccountPersistence } from '../../src/domain/repositories/Repositories';
import {
  AccountNotFrozenError,
  AccountNotFoundError,
  ForbiddenAccountAccessError,
} from '../../src/domain/exceptions/FinancialError';
import { buildBankAccount } from '../helpers/bankAccountFactory';

const OWNER = 'user-1';

describe('AccountReactivationService', () => {
  let bankRepo: BankAccountPersistence;
  let service: AccountReactivationService;

  beforeEach(() => {
    bankRepo = {
      getById: vi.fn(),
      getByIban: vi.fn(),
      getByOwner: vi.fn(),
      save: vi.fn(),
      persist: vi.fn().mockResolvedValue(undefined),
      recordMovement: vi.fn(),
    };
    service = new AccountReactivationService(bankRepo);
  });

  it('Reactiva una cuenta congelada y persiste el estado', async () => {
    const frozen = buildBankAccount({ accountStatus: 'FROZEN', ownerId: OWNER });
    vi.mocked(bankRepo.getById).mockResolvedValue(frozen);

    await service.execute('acc-1', OWNER);

    expect(frozen.status).toBe('ACTIVE');
    expect(bankRepo.persist).toHaveBeenCalledWith(frozen);
  });

  it('Rechaza si la cuenta ya está activa', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValue(
      buildBankAccount({ accountStatus: 'ACTIVE', ownerId: OWNER }),
    );

    await expect(service.execute('acc-1', OWNER)).rejects.toThrow(AccountNotFrozenError);
    expect(bankRepo.persist).not.toHaveBeenCalled();
  });

  it('Rechaza si la cuenta no existe', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValue(null);

    await expect(service.execute('acc-unknown', OWNER)).rejects.toThrow(AccountNotFoundError);
  });

  it('Rechaza acceso ajeno', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValue(
      buildBankAccount({ accountStatus: 'FROZEN', ownerId: 'otro' }),
    );

    await expect(service.execute('acc-1', OWNER)).rejects.toThrow(ForbiddenAccountAccessError);
  });
});
