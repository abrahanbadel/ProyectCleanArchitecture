import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthShell } from '../components/layout/AuthShell';
import { AuthField } from '../components/common/AuthField';
import type { BentoCardProps } from '../components/effects/MagicBento';
import { RegisterUserSchema } from '../../infrastructure/validation/AuthSchemas';
import { FieldError } from '../../domain/errors/ApiError';

const REGISTER_CARDS: BentoCardProps[] = [
  {
    color: '#120F17',
    label: 'Rápido',
    title: 'Regístrate en un minuto',
    description: 'Solo necesitas tu nombre, tu correo y una contraseña.',
  },
  {
    color: '#120F17',
    label: 'Primera cuenta',
    title: 'Tu cuenta se crea sola',
    description: 'Al terminar el registro ya tienes una cuenta lista para usar.',
  },
  {
    color: '#120F17',
    label: 'Protegido',
    title: 'Tu contraseña, a salvo',
    description: 'Se guarda con hash bcrypt, nunca en texto plano.',
  },
  {
    color: '#120F17',
    label: 'Todo en uno',
    title: 'Deposita, retira y transfiere',
    description: 'Todas tus operaciones en un solo lugar, desde el primer día.',
  },
];

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  // Se bloquea el formulario durante el envío y también mientras espera la redirección.
  const isLocked = isSubmitting || Boolean(successMessage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);
    setSuccessMessage(null);

    // Validar en el cliente con esquema Zod Espejo
    const validationResult = RegisterUserSchema.safeParse({ name, email, password });
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

    setIsSubmitting(true);

    try {
      await register({ name, email, password });
      setSuccessMessage('Usuario registrado con éxito. Serás redirigido a iniciar sesión...');
      redirectTimer.current = setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err && Array.isArray((err as { errors?: FieldError[] }).errors)) {
        const errorsMap: Record<string, string> = {};
        (err as { errors: FieldError[] }).errors.forEach((fe) => {
          errorsMap[fe.field] = fe.message;
        });
        setFieldErrors(errorsMap);
      }

      const message = err instanceof Error ? err.message : 'No se pudo completar el registro. Intente nuevamente.';
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      headline={<>Abre tu cuenta y <span>empieza a moverte</span>.</>}
      lead="Crea tu perfil en un minuto y gestiona tu dinero con total claridad."
      cards={REGISTER_CARDS}
    >
      <header className="auth-card__header">
        <h1>Crea tu cuenta</h1>
        <p>Completa tus datos para empezar a usar la plataforma.</p>
      </header>

      {successMessage && (
        <div className="auth-alert auth-alert--success" role="status">{successMessage}</div>
      )}
      {generalError && <div className="auth-alert" role="alert">{generalError}</div>}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField
          label="Nombre Completo"
          type="text"
          placeholder="Como aparece en tu documento"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors['name']}
          disabled={isLocked}
          required
        />
        <AuthField
          label="Correo Electrónico"
          type="email"
          placeholder="tucorreo@ejemplo.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors['email']}
          disabled={isLocked}
          required
        />
        <AuthField
          label="Contraseña"
          type="password"
          placeholder="Crea una contraseña segura"
          hint="Mínimo 8 caracteres, una mayúscula y un número."
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors['password']}
          disabled={isLocked}
          required
        />

        <button type="submit" className="auth-submit" disabled={isLocked} aria-busy={isSubmitting} aria-label="Registrarse">
          {isSubmitting && <span className="auth-submit__spinner" aria-hidden />}
          {isSubmitting ? 'Registrando…' : 'Registrarse'}
        </button>
      </form>

      <p className="auth-card__footer">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
      </p>
    </AuthShell>
  );
};