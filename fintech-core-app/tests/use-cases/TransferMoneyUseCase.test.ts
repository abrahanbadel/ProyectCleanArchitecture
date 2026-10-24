import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransferFundsService } from '../../src/use-cases/TransferMoneyUseCase';
import { BankAccountPersistence } from '../../src/domain/repositories/Repositories';
import { Transfer } from '../../src/domain/entities/Transaction';
import {
  InvalidAmountError,
  AccountNotFoundError,
  AccountFrozenError,
  InsufficientBalanceError,
  ForbiddenAccountAccessError,
} from '../../src/domain/exceptions/FinancialError';
import { InvalidPropValueError } from '../../src/domain/exceptions/DomainError';
import { Decimal } from 'decimal.js';
import { buildBankAccount } from '../helpers/bankAccountFactory';

const OWNER = 'user-1';

describe('TransferFundsService', () => {
  let bankRepo: BankAccountPersistence;
  let service: TransferFundsService;

  beforeEach(() => {
    bankRepo = {
      getById: vi.fn(),
      getByIban: vi.fn(),
      getByOwner: vi.fn(),
      save: vi.fn(),
      persist: vi.fn(),
      recordMovement: vi.fn(),
    };
    service = new TransferFundsService(bankRepo);
  });

  it('RF-3.3 Escenario 1: transferencia exitosa entre cuentas activas', async () => {
    const source = buildBankAccount({
      uid: 'acc-source',
      iban: 'ACC-1111',
      currentBalance: '500.00',
      ownerId: OWNER,
    });
    const destination = buildBankAccount({
      uid: 'acc-dest',
      iban: 'ACC-2222',
      currentBalance: '100.00',
      ownerId: 'user-2',
    });

    vi.mocked(bankRepo.getById).mockResolvedValueOnce(source);
    vi.mocked(bankRepo.getByIban).mockResolvedValueOnce(destination);

    const createdTx = Transfer.create({
      txId: 'tx-123',
      value: new Decimal('150.00'),
      txStatus: 'COMPLETED',
      originAccount: 'acc-source',
      targetAccount: 'acc-dest',
      note: 'Test transfer',
      timestamp: new Date(),
    });
    vi.mocked(bankRepo.recordMovement).mockResolvedValue(createdTx);

    const result = await service.execute(
      {
        sourceAccountId: 'acc-source',
        destinationAccountNumber: 'ACC-2222',
        amount: 150,
      },
      OWNER,
    );

    expect(result.transactionId).toBe('tx-123');
    expect(result.sourceAccountId).toBe('acc-source');
    expect(result.destinationAccountId).toBe('acc-dest');
    expect(result.amount).toBe(150);
    expect(bankRepo.recordMovement).toHaveBeenCalledOnce();
  });

  it('RF-3.3 Escenario 2: rechaza monto no positivo', async () => {
    await expect(
      service.execute(
        { sourceAccountId: 'acc-1', destinationAccountNumber: 'ACC-2222', amount: 0 },
        OWNER,
      ),
    ).rejects.toThrow(InvalidAmountError);
  });

  it('RF-3.3 Escenario 3: rechaza origen y destino idénticos', async () => {
    const sameAccount = buildBankAccount({
      uid: 'acc-1',
      iban: 'ACC-1111',
      ownerId: OWNER,
    });
    vi.mocked(bankRepo.getById).mockResolvedValueOnce(sameAccount);
    vi.mocked(bankRepo.getByIban).mockResolvedValueOnce(sameAccount);

    await expect(
      service.execute(
        { sourceAccountId: 'acc-1', destinationAccountNumber: 'ACC-1111', amount: 50 },
        OWNER,
      ),
    ).rejects.toThrow(InvalidPropValueError);
  });

  it('RF-3.3 Escenario 4: rechaza origen inexistente', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValueOnce(null);

    await expect(
      service.execute(
        { sourceAccountId: 'acc-404', destinationAccountNumber: 'ACC-2222', amount: 50 },
        OWNER,
      ),
    ).rejects.toThrow(AccountNotFoundError);
  });

  it('RF-3.3 Escenario 5: rechaza origen congelado (dominio en recordMovement)', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValueOnce(
      buildBankAccount({
        uid: 'acc-frozen',
        currentBalance: '1000.00',
        accountStatus: 'FROZEN',
        ownerId: OWNER,
      }),
    );
    vi.mocked(bankRepo.getByIban).mockResolvedValueOnce(
      buildBankAccount({ uid: 'acc-2', iban: 'ACC-2222', ownerId: 'user-2' }),
    );

    vi.mocked(bankRepo.recordMovement).mockRejectedValue(new AccountFrozenError('acc-frozen'));

    await expect(
      service.execute(
        {
          sourceAccountId: 'acc-frozen',
          destinationAccountNumber: 'ACC-2222',
          amount: 50,
        },
        OWNER,
      ),
    ).rejects.toThrow(AccountFrozenError);
  });

  it('RF-3.3 Escenario 6: rechaza saldo insuficiente (dominio en recordMovement)', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValueOnce(
      buildBankAccount({ uid: 'acc-poor', currentBalance: '20.00', ownerId: OWNER }),
    );
    vi.mocked(bankRepo.getByIban).mockResolvedValueOnce(
      buildBankAccount({ uid: 'acc-2', iban: 'ACC-2222', ownerId: 'user-2' }),
    );

    vi.mocked(bankRepo.recordMovement).mockRejectedValue(new InsufficientBalanceError('acc-poor'));

    await expect(
      service.execute(
        {
          sourceAccountId: 'acc-poor',
          destinationAccountNumber: 'ACC-2222',
          amount: 100,
        },
        OWNER,
      ),
    ).rejects.toThrow(InsufficientBalanceError);
  });

  it('RF-3.3 Escenario 7: rechaza destino inexistente', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValueOnce(
      buildBankAccount({ uid: 'acc-source', currentBalance: '500.00', ownerId: OWNER }),
    );
    vi.mocked(bankRepo.getByIban).mockResolvedValueOnce(null);

    await expect(
      service.execute(
        {
          sourceAccountId: 'acc-source',
          destinationAccountNumber: 'ACC-404',
          amount: 50,
        },
        OWNER,
      ),
    ).rejects.toThrow(AccountNotFoundError);
  });

  it('RF-3.3 Escenario 8: rechaza si el origen no pertenece al solicitante', async () => {
    vi.mocked(bankRepo.getById).mockResolvedValueOnce(
      buildBankAccount({ uid: 'acc-source', ownerId: 'otro' }),
    );

    await expect(
      service.execute(
        {
          sourceAccountId: 'acc-source',
          destinationAccountNumber: 'ACC-2222',
          amount: 50,
        },
        OWNER,
      ),
    ).rejects.toThrow(ForbiddenAccountAccessError);
  });

  it('RF-3.3 Escenario 9: rechaza si el número de cuenta de destino no está presente', async () => {
    await expect(
      service.execute(
        {
          sourceAccountId: 'acc-1',
          destinationAccountNumber: '',
          amount: 50,
        },
        OWNER,
      ),
    ).rejects.toThrow(InvalidPropValueError);
  });
});
