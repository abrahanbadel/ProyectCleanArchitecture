import type { ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import ClickSpark from '../effects/ClickSpark';
import MagicBento, { type BentoCardProps } from '../effects/MagicBento';
import './AuthShell.css';

interface AuthShellProps {
  /** Titular de la columna izquierda (puede incluir <span> para el degradado). */
  headline: ReactNode;
  lead: string;
  /** Tarjetas del bento (se recomiendan 4). */
  cards: BentoCardProps[];
  /** Contenido de la tarjeta de vidrio (encabezado + formulario). */
  children: ReactNode;
}

const Brand = ({ compact = false }: { compact?: boolean }) => (
  <div className={compact ? 'login__brand login__brand--compact' : 'login__brand'}>
    <span className="login__logo" aria-hidden>F</span>
    <span className="login__brand-name">Fintech Core</span>
  </div>
);

/**
 * Marco visual compartido por Login y Registro.
 * Ocupa toda la pantalla (position: fixed) por encima del layout de la app.
 */
export function AuthShell({ headline, lead, cards, children }: AuthShellProps) {
  const prefersReducedMotion = useReducedMotion();
  const showShowcase = useMediaQuery('(min-width: 960px)');

  const stage = (
    <div className="login__stage">
      <div className="login__bg" aria-hidden />

      <main className="login__layout">
        {showShowcase && (
          <section className="login__showcase login-showcase" aria-label="Beneficios de la plataforma">
            <Brand />
            <p className="login__headline">{headline}</p>
            <p className="login__lead">{lead}</p>

            <MagicBento
              cards={cards}
              textAutoHide={false}
              enableStars
              enableSpotlight
              enableBorderGlow
              enableTilt={false}
              enableMagnetism={false}
              clickEffect
              spotlightRadius={320}
              particleCount={10}
              glowColor="132, 0, 255"
              disableAnimations={Boolean(prefersReducedMotion)}
            />
          </section>
        )}

        <section className="login__panel">
          <div className="auth-card">
            {!showShowcase && <Brand compact />}
            {children}
          </div>
        </section>
      </main>
    </div>
  );

  return (
    <div className="login">
      {prefersReducedMotion ? (
        stage
      ) : (
        <ClickSpark sparkColor="#c4b5fd" sparkSize={12} sparkRadius={22} sparkCount={8} duration={450}>
          {stage}
        </ClickSpark>
      )}
    </div>
  );
}
