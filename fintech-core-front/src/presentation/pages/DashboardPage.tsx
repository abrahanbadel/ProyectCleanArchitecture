import React, { useState, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAccount } from '../hooks/useAccount';
import { useTransaction } from '../hooks/useTransaction';
import { AccountSummaryCard } from '../components/account/AccountSummaryCard';
import { AccountList } from '../components/account/AccountList';
import { AccountDetailModal } from '../components/account/AccountDetailModal';
import { DepositFormModal } from '../components/transaction/DepositFormModal';
import { WithdrawFormModal } from '../components/transaction/WithdrawFormModal';
import { TransferFormModal } from '../components/transaction/TransferFormModal';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import './DashboardPage.css';

/* ---------- Utilidades de presentación ---------- */

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const Icon = ({ children }: { children: ReactNode }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

const DepositIcon = () => (
  <Icon><path d="M12 4v12" /><path d="M7 11l5 5 5-5" /><path d="M5 20h14" /></Icon>
);
const WithdrawIcon = () => (
  <Icon><path d="M12 20V8" /><path d="M7 13l5-5 5 5" /><path d="M5 4h14" /></Icon>
);
const TransferIcon = () => (
  <Icon><path d="M4 8h13" /><path d="M13 4l4 4-4 4" /><path d="M20 16H7" /><path d="M11 12l-4 4 4 4" /></Icon>
);
const PlusIcon = () => (
  <Icon><path d="M12 5v14" /><path d="M5 12h14" /></Icon>
);

interface ActionTileProps {
  label: string;
  hint: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  primary?: boolean;
}

const ActionTile: React.FC<ActionTileProps> = ({ label, hint, icon, onClick, disabled, loading, primary }) => (
  <button
    type="button"
    className={`dash-tile${primary ? ' dash-tile--primary' : ''}`}
    onClick={onClick}
    disabled={disabled || loading}
    aria-busy={loading}
    aria-label={label}
  >
    <span className="dash-tile__icon">
      {loading ? <span className="dash-spinner" aria-hidden /> : icon}
    </span>
    <span className="dash-tile__text">
      <strong>{label}</strong>
      <small>{hint}</small>
    </span>
  </button>
);

/* ---------- Página ---------- */

export const DashboardPage: React.FC = () => {
  const { session } = useAuth();
  const {
    accounts,
    selectedAccount,
    history,
    status: accountStatus,
    error: accountError,
    actionLoading: accountActionLoading,
    actionError: accountActionError,
    fetchAccounts,
    createAccount,
    freezeAccount,
    unfreezeAccount,
    selectAccount,
    closeAccountDetail,
    retry: retryAccounts,
  } = useAccount();

  const {
    isLoading: transactionLoading,
    error: transactionError,
    deposit,
    withdraw,
    transfer,
    clearState: clearTransactionState,
  } = useTransaction();

  // Estados de control de modales de transacciones
  const [activeModal, setActiveModal] = useState<'deposit' | 'withdraw' | 'transfer' | null>(null);
  const [targetAccountId, setTargetAccountId] = useState<string | undefined>(undefined);

  const handleOpenDeposit = (accountId?: string) => {
    clearTransactionState();
    setTargetAccountId(accountId || accounts[0]?.id);
    setActiveModal('deposit');
  };

  const handleOpenWithdraw = (accountId?: string) => {
    clearTransactionState();
    setTargetAccountId(accountId || accounts[0]?.id);
    setActiveModal('withdraw');
  };

  const handleOpenTransfer = (accountId?: string) => {
    clearTransactionState();
    setTargetAccountId(accountId || accounts[0]?.id);
    setActiveModal('transfer');
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    clearTransactionState();
  };

  const handleDepositSubmit = async (params: { accountId: string; amount: number }) => {
    const result = await deposit(params);
    if (result) {
      // Refrescar saldo e historial desde el servidor tras confirmación del backend
      await fetchAccounts();
      if (selectedAccount && selectedAccount.id === params.accountId) {
        await selectAccount(params.accountId);
      }
      handleCloseModal();
    }
  };

  const handleWithdrawSubmit = async (params: { accountId: string; amount: number }) => {
    const result = await withdraw(params);
    if (result) {
      // Refrescar saldo e historial desde el servidor tras confirmación del backend
      await fetchAccounts();
      if (selectedAccount && selectedAccount.id === params.accountId) {
        await selectAccount(params.accountId);
      }
      handleCloseModal();
    }
  };

  const handleTransferSubmit = async (params: {
    sourceAccountId: string;
    destinationAccountNumber: string;
    amount: number;
    description?: string;
  }) => {
    const result = await transfer(params);
    if (result) {
      // Refrescar saldos e historial desde el servidor tras confirmación del backend
      await fetchAccounts();
      if (selectedAccount && selectedAccount.id === params.sourceAccountId) {
        await selectAccount(selectedAccount.id);
      }
      handleCloseModal();
    }
  };

  /* ---- Datos derivados para la vista ---- */
  const fullName = session?.user?.name?.trim();
  const shownName = fullName
    ? fullName.split(/\s+/)[0]
    : (session?.user?.email ?? '').split('@')[0];

  const hasAccounts = accounts.length > 0;
  const isInitialLoading = accountStatus === 'loading';

  return (
    <div className="dash">
      {/* Banner de bienvenida */}
      <section className="dash-hero">
        <div className="dash-hero__body">
          <p className="dash-hero__eyebrow">Panel Principal</p>
          <h1 className="dash-hero__title">
            {getGreeting()}, <span>{shownName}</span>
          </h1>
          <p className="dash-hero__lead">
            Consulta tus saldos, mueve tu dinero y revisa cada movimiento desde un solo lugar.
          </p>
        </div>

        {accountStatus === 'success' && (
          <div className="dash-hero__chip" aria-label="Resumen de cuentas">
            <strong>{accounts.length}</strong>
            <span>{accounts.length === 1 ? 'cuenta a tu nombre' : 'cuentas a tu nombre'}</span>
          </div>
        )}
      </section>

      {/* Acciones rápidas */}
      <section className="dash-actions" aria-label="Acciones rápidas">
        <ActionTile
          label="Depósito"
          hint="Suma fondos a una cuenta"
          icon={<DepositIcon />}
          disabled={!hasAccounts || isInitialLoading}
          onClick={() => handleOpenDeposit()}
        />
        <ActionTile
          label="Retiro"
          hint="Retira fondos disponibles"
          icon={<WithdrawIcon />}
          disabled={!hasAccounts || isInitialLoading}
          onClick={() => handleOpenWithdraw()}
        />
        <ActionTile
          label="Transferencia"
          hint="Envía dinero a otra cuenta"
          icon={<TransferIcon />}
          disabled={!hasAccounts || isInitialLoading}
          onClick={() => handleOpenTransfer()}
        />
        <ActionTile
          label="Nueva cuenta"
          hint="Abre otra cuenta a tu nombre"
          icon={<PlusIcon />}
          primary
          loading={accountActionLoading}
          disabled={isInitialLoading}
          onClick={() => createAccount()}
        />
      </section>

      <ErrorAlert error={accountActionError} />

      {/* Manejo explícito de los 4 estados principales de UI */}
      {accountStatus === 'loading' && (
        <div className="dash-card">
          <LoadingSpinner message="Cargando tus cuentas bancarias..." />
        </div>
      )}

      {accountStatus === 'error' && (
        <div className="dash-card dash-card--center">
          <ErrorAlert error={accountError} />
          <Button variant="primary" onClick={retryAccounts} style={{ marginTop: '1rem' }}>
            Reintentar Consulta
          </Button>
        </div>
      )}

      {accountStatus === 'empty' && (
        <div className="dash-card">
          <EmptyState
            title="Aún no tienes cuentas creadas"
            description="Crea tu primera cuenta bancaria en segundos para comenzar a realizar depósitos y transferencias."
            actionLabel="Crear mi primera cuenta"
            onAction={() => createAccount()}
          />
        </div>
      )}

      {accountStatus === 'success' && (
        <>
          <section className="dash-block" aria-label="Resumen de saldos">
            <AccountSummaryCard accounts={accounts} />
          </section>

          <section className="dash-block" aria-labelledby="dash-accounts-title">
            <div className="dash-section">
              <h2 id="dash-accounts-title">Tus cuentas bancarias</h2>
              <span className="dash-badge">{accounts.length}</span>
            </div>

            <AccountList
              accounts={accounts}
              currentUserId={session?.user?.id}
              isActionLoading={accountActionLoading}
              onSelectAccount={selectAccount}
              onFreezeAccount={freezeAccount}
              onUnfreezeAccount={unfreezeAccount}
            />
          </section>
        </>
      )}

      {/* Modal de Detalle e Historial de Cuenta */}
      <AccountDetailModal
        account={selectedAccount}
        history={history}
        onClose={closeAccountDetail}
      />

      {/* Modales de Transacciones */}
      {hasAccounts && (
        <>
          <DepositFormModal
            accounts={accounts}
            defaultAccountId={targetAccountId}
            isOpen={activeModal === 'deposit'}
            isLoading={transactionLoading}
            error={transactionError}
            onClose={handleCloseModal}
            onSubmit={handleDepositSubmit}
          />

          <WithdrawFormModal
            accounts={accounts}
            defaultAccountId={targetAccountId}
            isOpen={activeModal === 'withdraw'}
            isLoading={transactionLoading}
            error={transactionError}
            onClose={handleCloseModal}
            onSubmit={handleWithdrawSubmit}
          />

          <TransferFormModal
            accounts={accounts}
            defaultSourceAccountId={targetAccountId}
            isOpen={activeModal === 'transfer'}
            isLoading={transactionLoading}
            error={transactionError}
            onClose={handleCloseModal}
            onSubmit={handleTransferSubmit}
          />
        </>
      )}
    </div>
  );
};
