import React from 'react';
import { Account } from '../../../domain/entities/Account';
import { AccountActions } from './AccountActions';
import { formatCurrency } from '../../utils/money';
import './account.css';

interface AccountCardProps {
  account: Account;
  isOwner: boolean;
  isActionLoading: boolean;
  onSelect: (accountId: string) => void;
  onFreeze: (accountId: string) => void;
  onUnfreeze: (accountId: string) => void;
}

const ChipIcon = () => (
  <svg width="34" height="26" viewBox="0 0 34 26" fill="none" aria-hidden>
    <rect x="1" y="1" width="32" height="24" rx="6" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.45)" />
    <path d="M1 9h32M1 17h32M12 1v24M22 1v24" stroke="rgba(255,255,255,0.35)" />
  </svg>
);

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  isOwner,
  isActionLoading,
  onSelect,
  onFreeze,
  onUnfreeze,
}) => {
  const isFrozen = account.status === 'FROZEN';

  return (
    <article className={`acc-card${isFrozen ? ' acc-card--frozen' : ''}`}>
      {/* Zona clicable: abre el detalle. Las acciones van fuera para no anidar botones. */}
      <button
        type="button"
        className="acc-card__main"
        onClick={() => onSelect(account.id)}
        aria-label={`Ver detalle de la cuenta ${account.accountNumber}`}
      >
        <span className="acc-card__top">
          <ChipIcon />
          <span className={`acc-badge ${isFrozen ? 'acc-badge--frozen' : 'acc-badge--active'}`}>
            {isFrozen ? 'CONGELADA' : 'ACTIVA'}
          </span>
        </span>

        <span className="acc-card__number">{account.accountNumber}</span>

        <span className="acc-card__balance">
          <small>Saldo disponible</small>
          <strong>{formatCurrency(account.balance)}</strong>
        </span>
      </button>

      <div className="acc-card__footer">
        <span className="acc-card__hint">Toca para ver el historial</span>
        <AccountActions
          status={account.status}
          isOwner={isOwner}
          isLoading={isActionLoading}
          onFreeze={() => onFreeze(account.id)}
          onUnfreeze={() => onUnfreeze(account.id)}
        />
      </div>
    </article>
  );
};
