import React from 'react';
import { AccountStatus } from '../../../domain/entities/Account';
import './account.css';

interface AccountActionsProps {
  status: AccountStatus;
  isOwner: boolean;
  isLoading: boolean;
  onFreeze: () => void;
  onUnfreeze: () => void;
}

export const AccountActions: React.FC<AccountActionsProps> = ({
  status,
  isOwner,
  isLoading,
  onFreeze,
  onUnfreeze,
}) => {
  if (!isOwner) {
    return <span className="acc-muted">No autorizado para gestionar</span>;
  }

  const isActive = status === 'ACTIVE';

  return (
    <div className="acc-actions">
      <button
        type="button"
        className={`acc-action${isActive ? '' : ' acc-action--primary'}`}
        disabled={isLoading}
        aria-busy={isLoading}
        onClick={(e) => {
          e.stopPropagation();
          if (isActive) onFreeze();
          else onUnfreeze();
        }}
      >
        {isLoading ? 'Procesando…' : isActive ? 'Congelar' : 'Descongelar'}
      </button>
    </div>
  );
};
