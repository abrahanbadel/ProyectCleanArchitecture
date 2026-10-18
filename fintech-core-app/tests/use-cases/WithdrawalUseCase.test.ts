import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CashWithdrawalService } from '../../src/use-cases/WithdrawalUseCase';
import { BankAccountPersistence } from '../../src/domain/repositories/Repositories';
import {
  InvalidAmountError,
  AccountNotFoundError,
  AccountFrozenError,
  InsufficientBalanceError,
  ForbiddenAccountAccessError,
} from '../../src/domain/exceptions/FinancialError';
import { buildBankAccount } from '../helpers/bankAccountFactory';

const OWNER = 'user-1';

describe('CashWithdrawalService', () => {
  let bankRepo: BankAccountPersistence;
  let service: CashWithdrawalService;

  beforeEach(() => {
    bankRepo = {
      getById: vi.fn(),
      getByIban: vi.fn(),
      getByOwner: vi.fn(),
      save: vi.fn(),
      persist: vi.fn(),
      recordMovement: vi.fn().mockResolvedValue({}),
    };
    service = new CashWithdrawalService(bankRepo);
  });

  it('RF-3.2 Escenario 1: retiro exitoso registra movimiento y retorna saldo', async () => {
    const existing = buildBankAccount({ currentBalance: '200.00', ownerId: OWNER });
    const updated = buildBankAccount({ currentBalance: '150.00', ownerId: OWNER });

    vi.mocked(bankRepo.getById)
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(updated);

    const result = await service.execute({ accountId: 'acc-1', amount: 50 }, OWNER);

    expect(result.accountId).toBe('acc-1');
    expect(result.newBalance).toBe(150);
    expect(bankRepo.recordMovement).toHaveBeenCalledOnce();
  });

  it('RF-3.2 Escenario 2: rechaza saldo insuficiente (dominio en recordMovement)', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValue(
      buildBankAccount({ currentBalance: '30.00', ownerId: OWNER }),
    );
    vi.mocked(bankRepo.recordMovement).mockRejectedValue(new InsufficientBalanceError('acc-1'));

    await expect(
      service.execute({ accountId: 'acc-1', amount: 100 }, OWNER),
    ).rejects.toThrow(InsufficientBalanceError);
  });

  it('RF-3.2 Escenario 3: rechaza cuenta congelada (dominio en recordMovement)', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValue(
      buildBankAccount({
        uid: 'acc-frozen',
        currentBalance: '500.00',
        accountStatus: 'FROZEN',
        ownerId: OWNER,
      }),
    );
    vi.mocked(bankRepo.recordMovement).mockRejectedValue(new AccountFrozenError('acc-frozen'));

    await expect(
      service.execute({ accountId: 'acc-frozen', amount: 50 }, OWNER),
    ).rejects.toThrow(AccountFrozenError);
  });

  it('RF-3.2 Escenario 4: rechaza monto no positivo', async () => {
    await expect(service.execute({ accountId: 'acc-1', amount: 0 }, OWNER)).rejects.toThrow(
      InvalidAmountError,
    );
    await expect(service.execute({ accountId: 'acc-1', amount: -10 }, OWNER)).rejects.toThrow(
      InvalidAmountError,
    );
  });

  it('RF-3.2 Escenario 5: rechaza cuenta inexistente', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValue(null);

    await expect(
      service.execute({ accountId: 'acc-unknown', amount: 50 }, OWNER),
    ).rejects.toThrow(AccountNotFoundError);
  });

  it('RF-3.2 Escenario 6: rechaza acceso ajeno', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValue(buildBankAccount({ ownerId: 'otro' }));

    await expect(
      service.execute({ accountId: 'acc-1', amount: 50 }, OWNER),
    ).rejects.toThrow(ForbiddenAccountAccessError);
  });
});
