import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthShell } from '../components/layout/AuthShell';
import { AuthField } from '../components/common/AuthField';
import type { BentoCardProps } from '../components/effects/MagicBento';
import { LoginSchema } from '../../infrastructure/validation/AuthSchemas';
import { FieldError } from '../../domain/errors/ApiError';

const LOGIN_CARDS: BentoCardProps[] = [
  {
    color: '#120F17',
    label: 'Empieza hoy',
    title: 'Tu cuenta, lista al instante',
    description: 'Regístrate y recibe tu primera cuenta en el momento.',
  },
  {
    color: '#120F17',
    label: 'Envía dinero',
    title: 'Transfiere en pocos clics',
    description: 'A cualquier cuenta de la plataforma, sin filas ni papeleo.',
  },
  {
    color: '#120F17',
    label: 'Tú tienes el control',
    title: 'Congela tu cuenta cuando quieras',
    description: 'Si algo no te cuadra, bloquea los retiros y vuelve a activarla.',
  },
  {
    color: '#120F17',
    label: 'Todo a la vista',
    title: 'Cada movimiento, claro',
    description: 'Saldos al día e historial ordenado, siempre contigo.',
  },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    // Validar en el cliente con esquema Zod Espejo
    const validationResult = LoginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      const errorsMap: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        const fieldName = err.path[0];
        if (typeof fieldName === 'string') {
          errorsMap[fieldName] = err.message;
        }
      });
      setFieldErrors(errorsMap);
      return;
    }

    // Bloquear el formulario durante el envío
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err && Array.isArray((err as { errors?: FieldError[] }).errors)) {
        const errorsMap: Record<string, string> = {};
        (err as { errors: FieldError[] }).errors.forEach((fe) => {
          errorsMap[fe.field] = fe.message;
        });
        setFieldErrors(errorsMap);
      }

      const message = err instanceof Error ? err.message : 'Credenciales inválidas. Por favor verifique sus datos.';
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      headline={<>Tu dinero, <span>bajo control</span> en cada movimiento.</>}
      lead="Gestiona cuentas, deposita, retira y transfiere con la precisión de un core transaccional."
      cards={LOGIN_CARDS}
    >
      <header className="auth-card__header">
        <h1>Bienvenido de nuevo</h1>
        <p>Ingresa tus credenciales para acceder a tu panel financiero.</p>
      </header>

      {generalError && <div className="auth-alert" role="alert">{generalError}</div>}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField
          label="Correo Electrónico"
          type="email"
          placeholder="tucorreo@ejemplo.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors['email']}
          disabled={isSubmitting}
          required
        />
        <AuthField
          label="Contraseña"
          type="password"
          placeholder="Tu contraseña"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors['password']}
          disabled={isSubmitting}
          required
        />

        <button type="submit" className="auth-submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting && <span className="auth-submit__spinner" aria-hidden />}
          {isSubmitting ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <p className="auth-card__footer">
        ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
      </p>
    </AuthShell>
  );
};