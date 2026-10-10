import React, { useEffect, useId, type ReactNode } from 'react';
import { Account } from '../../../domain/entities/Account';
import { TransactionHistory } from '../../../domain/entities/Transaction';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/money';
import './account.css';

interface AccountDetailModalProps {
  account: Account | null;
  history: TransactionHistory | null;
  onClose: () => void;
}

const TX_STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Completada',
  PENDING: 'Pendiente',
  FAILED: 'Fallida',
};

const TxIcon = ({ children }: { children: ReactNode }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

const iconFor = (type: string): ReactNode => {
  if (type === 'DEPOSIT') return <TxIcon><path d="M12 5v14" /><path d="M6 13l6 6 6-6" /></TxIcon>;
  if (type === 'WITHDRAWAL') return <TxIcon><path d="M12 19V5" /><path d="M6 11l6-6 6 6" /></TxIcon>;
  return <TxIcon><path d="M4 8h14" /><path d="M14 4l4 4-4 4" /><path d="M20 16H6" /><path d="M10 12l-4 4 4 4" /></TxIcon>;
};

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  account,
  history,
  onClose,
}) => {
  const titleId = useId();

  // Cerrar con la tecla Escape mientras el modal está abierto
  useEffect(() => {
    if (!account) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [account, onClose]);

  if (!account) return null;

  const isFrozen = account.status === 'FROZEN';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id={titleId}>Detalle de Cuenta</h3>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar modal">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className={`acc-detail${isFrozen ? ' acc-detail--frozen' : ''}`}>
            <div className="acc-detail__row">
              <span className="acc-detail__label">Número de cuenta</span>
              <span className={`acc-badge ${isFrozen ? 'acc-badge--frozen' : 'acc-badge--active'}`}>
                {isFrozen ? 'CONGELADA' : 'ACTIVA'}
              </span>
            </div>
            <strong className="acc-detail__number">{account.accountNumber}</strong>

            <span className="acc-detail__label">Saldo confirmado</span>
            <strong className="acc-detail__balance">{formatCurrency(account.balance)}</strong>
          </div>

          <h4 className="acc-history__title">Historial de transacciones</h4>

          {history && history.transactions.length > 0 ? (
            <ul className="acc-history">
              {history.transactions.map((tx) => {
                const type = String(tx.type);
                const status = String(tx.status);
                const tone = type === 'DEPOSIT' ? 'in' : type === 'WITHDRAWAL' ? 'out' : 'move';

                return (
                  <li key={tx.id} className="acc-tx">
                    <span className={`acc-tx__icon acc-tx__icon--${tone}`}>{iconFor(type)}</span>

                    <div className="acc-tx__info">
                      <span className="acc-tx__type">{type}</span>
                      <span className="acc-tx__date">
                        {new Date(tx.createdAt).toLocaleString('es-CO', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <div className="acc-tx__amounts">
                      <span className={`acc-tx__amount acc-tx__amount--${tone}`}>
                        ${tx.amount.toFixed(2)}
                      </span>
                      <span className={`acc-tx__status acc-tx__status--${status.toLowerCase()}`}>
                        {TX_STATUS_LABEL[status] ?? status}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="acc-history__empty">No se registran transacciones para esta cuenta.</p>
          )}
        </div>

        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
