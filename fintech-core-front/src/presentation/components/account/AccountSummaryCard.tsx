import React from 'react';
import { Account } from '../../../domain/entities/Account';
import { formatCurrency } from '../../utils/money';
import './account.css';

interface AccountSummaryCardProps {
  accounts: Account[];
}

export const AccountSummaryCard: React.FC<AccountSummaryCardProps> = ({ accounts }) => {
  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE');
  const frozenAccounts = accounts.filter((a) => a.status === 'FROZEN');

  const totalActiveBalance = activeAccounts.reduce((sum, a) => sum + a.balance, 0);

  const total = accounts.length;
  const activePct = total > 0 ? (activeAccounts.length / total) * 100 : 0;
  const frozenPct = total > 0 ? (frozenAccounts.length / total) * 100 : 0;

  return (
    <div className="acc-summary">
      <div className="acc-summary__top">
        <div>
          <span className="acc-summary__label">Saldo Total Activo</span>
          <h3 className="acc-summary__total">{formatCurrency(totalActiveBalance)}</h3>
        </div>

        <div className="acc-summary__stats">
          <div className="acc-pill">
            <strong>{total}</strong>
            <span>Cuentas Totales</span>
          </div>
          <div className="acc-pill acc-pill--ok">
            <strong>{activeAccounts.length}</strong>
            <span>Activas</span>
          </div>
          <div className="acc-pill acc-pill--frozen">
            <strong>{frozenAccounts.length}</strong>
            <span>Congeladas</span>
          </div>
        </div>
      </div>

      <div
        className="acc-bar"
        role="img"
        aria-label={`${activeAccounts.length} cuentas activas y ${frozenAccounts.length} congeladas`}
      >
        <span className="acc-bar__active" style={{ width: `${activePct}%` }} />
        <span className="acc-bar__frozen" style={{ width: `${frozenPct}%` }} />
      </div>
    </div>
  );
};
