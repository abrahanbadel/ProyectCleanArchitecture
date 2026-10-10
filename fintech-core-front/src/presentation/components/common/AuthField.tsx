import { useId, useState, type ComponentPropsWithoutRef } from 'react';
import { SmoothInput } from './SmoothInput';
import './AuthField.css';

type AuthFieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'id'> & {
  label: string;
  error?: string;
  hint?: string;
  type?: 'text' | 'email' | 'password';
};

const EyeIcon = ({ off }: { off: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);

export function AuthField({ label, error, hint, type = 'text', ...props }: AuthFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const [visible, setVisible] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && !visible ? 'password' : 'text';

  return (
    <div className="auth-field">
      <label className="auth-field__label" htmlFor={id}>{label}</label>
      <SmoothInput
        {...props}
        id={id}
        type={inputType}
        inputMode={type === 'email' ? 'email' : props.inputMode}
        spellCheck={false}
        hasError={Boolean(error)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        endAdornment={
          isPassword ? (
            <button
              type="button"
              className="auth-field__toggle"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={visible}
              disabled={props.disabled}
            >
              <EyeIcon off={visible} />
            </button>
          ) : undefined
        }
      />
      {!error && hint && <p id={hintId} className="auth-field__hint">{hint}</p>}
      {error && <p id={errorId} className="auth-field__error" role="alert">{error}</p>}
    </div>
  );
}
