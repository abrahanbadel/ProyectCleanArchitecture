import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FundDepositService } from '../../src/use-cases/DepositUseCase';
import { BankAccountPersistence } from '../../src/domain/repositories/Repositories';
import {
  InvalidAmountError,
  AccountNotFoundError,
  AccountFrozenError,
  ForbiddenAccountAccessError,
} from '../../src/domain/exceptions/FinancialError';
import { buildBankAccount } from '../helpers/bankAccountFactory';

const OWNER = 'user-1';

describe('FundDepositService', () => {
  let bankRepo: BankAccountPersistence;
  let service: FundDepositService;

  beforeEach(() => {
    bankRepo = {
      getById: vi.fn(),
      getByIban: vi.fn(),
      getByOwner: vi.fn(),
      save: vi.fn(),
      persist: vi.fn(),
      recordMovement: vi.fn().mockResolvedValue({}),
    };
    service = new FundDepositService(bankRepo);
  });

  it('RF-3.1 Escenario 1: depósito exitoso registra movimiento y retorna saldo', async () => {
    const existing = buildBankAccount({ currentBalance: '100.00', ownerId: OWNER });
    const updated = buildBankAccount({ currentBalance: '150.00', ownerId: OWNER });

    vi.mocked(bankRepo.getById)
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(updated);

    const result = await service.execute({ accountId: 'acc-1', amount: 50 }, OWNER);

    expect(result.accountId).toBe('acc-1');
    expect(result.newBalance).toBe(150);
    expect(bankRepo.recordMovement).toHaveBeenCalledOnce();
  });

  it('RF-3.1 Escenario 2: rechaza monto no positivo', async () => {
    await expect(service.execute({ accountId: 'acc-1', amount: 0 }, OWNER)).rejects.toThrow(
      InvalidAmountError,
    );
    await expect(service.execute({ accountId: 'acc-1', amount: -25 }, OWNER)).rejects.toThrow(
      InvalidAmountError,
    );
    expect(bankRepo.recordMovement).not.toHaveBeenCalled();
  });

  it('RF-3.1 Escenario 3: rechaza cuenta inexistente', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValue(null);

    await expect(
      service.execute({ accountId: 'acc-nonexistent', amount: 50 }, OWNER),
    ).rejects.toThrow(AccountNotFoundError);
  });

  it('RF-3.1 Escenario 4: rechaza cuenta congelada (invariante de dominio en recordMovement)', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValue(
      buildBankAccount({ uid: 'acc-frozen', accountStatus: 'FROZEN', ownerId: OWNER }),
    );
    vi.mocked(bankRepo.recordMovement).mockRejectedValue(new AccountFrozenError('acc-frozen'));

    await expect(
      service.execute({ accountId: 'acc-frozen', amount: 50 }, OWNER),
    ).rejects.toThrow(AccountFrozenError);
  });

  it('RF-3.1 Escenario 5: rechaza acceso si la cuenta no es del solicitante', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValue(
      buildBankAccount({ ownerId: 'otro-usuario' }),
    );

    await expect(
      service.execute({ accountId: 'acc-1', amount: 50 }, OWNER),
    ).rejects.toThrow(ForbiddenAccountAccessError);
  });
});
