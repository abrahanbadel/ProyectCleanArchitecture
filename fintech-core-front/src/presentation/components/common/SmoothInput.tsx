/**
 * Input con cursor animado (caret con spring).
 * Adaptado de skiper106: sin dialkit, sin Tailwind, sin `cn`. Solo requiere framer-motion.
 *
 * Nota: solo soporta type "text" | "password". Los <input type="email"> devuelven
 * selectionStart = null y rompen el cálculo del cursor; para correo usa type="text"
 * con inputMode="email".
 */
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from 'framer-motion';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type ReactNode,
} from 'react';
import './SmoothInput.css';

const SPRING = { stiffness: 500, damping: 30, mass: 0.5 } as const;
const INSTANT = { stiffness: 10000, damping: 100, mass: 0.1 } as const;

const UA = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const IS_FIREFOX = /firefox|fxios/i.test(UA);
const IS_CHROMIUM = /chrome|chromium|crios/i.test(UA);
const PASSWORD_CHAR = IS_FIREFOX ? '\u25CF' : '\u2022';

const cx = (...parts: Array<string | false | undefined>): string =>
  parts.filter(Boolean).join(' ');

function syncMeasureSpan(input: HTMLInputElement, span: HTMLSpanElement): void {
  const styles = window.getComputedStyle(input);
  let fontSize = styles.fontSize;
  if (PASSWORD_CHAR === '\u2022' && input.type === 'password' && !IS_CHROMIUM) {
    fontSize = `${parseFloat(fontSize) + 6.25}px`;
  }
  span.style.font = `${styles.fontStyle} ${styles.fontWeight} ${fontSize} ${styles.fontFamily}`;
  span.style.letterSpacing = styles.letterSpacing;
  span.style.fontFeatureSettings = styles.fontFeatureSettings;
  span.style.fontVariationSettings = styles.fontVariationSettings;
}

function measurePrefixWidth(input: HTMLInputElement, span: HTMLSpanElement, text: string): number {
  syncMeasureSpan(input, span);
  span.textContent = text;
  const paddingLeft = parseFloat(window.getComputedStyle(input).paddingLeft) || 0;
  return text.length > 0 ? span.offsetWidth + paddingLeft : paddingLeft - 1;
}

function scrollCaretIntoView(target: HTMLInputElement, absoluteWidth: number): void {
  const styles = window.getComputedStyle(target);
  const paddingLeft = parseFloat(styles.paddingLeft) || 0;
  const paddingRight = parseFloat(styles.paddingRight) || 0;
  const maxScroll = Math.max(0, target.scrollWidth - target.clientWidth);
  const visibleRight = target.scrollLeft + target.clientWidth - paddingRight;
  const visibleLeft = target.scrollLeft + paddingLeft;

  if (absoluteWidth > visibleRight) {
    target.scrollLeft = Math.min(absoluteWidth - target.clientWidth + paddingRight, maxScroll);
    return;
  }
  if (absoluteWidth < visibleLeft) {
    target.scrollLeft = Math.max(0, absoluteWidth - paddingLeft);
  }
}

function getCaretIndex(target: HTMLInputElement): number {
  const start = target.selectionStart ?? 0;
  const end = target.selectionEnd ?? 0;
  if (start === end) return start;
  return target.selectionDirection === 'backward' ? start : end;
}

function updateCaret(
  input: HTMLInputElement,
  span: HTMLSpanElement,
  caretX: MotionValue<number>,
  caretOpacity: MotionValue<number>,
): void {
  const hasSelection = (input.selectionStart ?? 0) !== (input.selectionEnd ?? 0);
  const caretIndex = getCaretIndex(input);
  const textBeforeCaret =
    input.type === 'password' ? PASSWORD_CHAR.repeat(caretIndex) : input.value.slice(0, caretIndex);

  const absoluteWidth = measurePrefixWidth(input, span, textBeforeCaret);
  scrollCaretIntoView(input, absoluteWidth);

  const styles = window.getComputedStyle(input);
  const paddingLeft = parseFloat(styles.paddingLeft) || 0;
  const paddingRight = parseFloat(styles.paddingRight) || 0;
  const caretPosition = absoluteWidth - input.scrollLeft;
  const minX = paddingLeft - 1;
  const maxX = input.clientWidth - paddingRight;
  const isCaretVisible = caretPosition >= minX && caretPosition <= maxX + 1;

  caretX.set(Math.min(caretPosition, maxX));
  caretOpacity.set(!isCaretVisible || hasSelection ? 0 : 1);
}

export type SmoothInputType = 'text' | 'password';

export type SmoothInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'> & {
  type?: SmoothInputType;
  wrapperClassName?: string;
  hasError?: boolean;
  /** Contenido a la derecha dentro del campo (ej. botón mostrar/ocultar). */
  endAdornment?: ReactNode;
};

export function SmoothInput({
  className,
  wrapperClassName,
  hasError,
  endAdornment,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  type = 'text',
  ...props
}: SmoothInputProps) {
  const [internalValue, setInternalValue] = useState<string>(String(defaultValue ?? ''));
  const caretX = useMotionValue(0);
  const caretOpacity = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const springCaretX = useSpring(caretX, prefersReducedMotion ? INSTANT : SPRING);

  const isControlled = value !== undefined;
  const inputValue = isControlled ? String(value) : internalValue;

  const refresh = useCallback((): void => {
    const input = inputRef.current;
    const span = measureRef.current;
    if (input && span && document.activeElement === input) {
      updateCaret(input, span, caretX, caretOpacity);
    }
  }, [caretX, caretOpacity]);

  useEffect(() => {
    refresh();
  }, [inputValue, type, refresh]);

  useEffect(() => {
    const input = inputRef.current;
    const container = containerRef.current;
    if (!input || !container) return;

    const onSelectionChange = (): void => {
      if (document.activeElement !== input) return;
      requestAnimationFrame(refresh);
    };

    document.addEventListener('selectionchange', onSelectionChange);
    const hasFonts = typeof document !== 'undefined' && 'fonts' in document && Boolean(document.fonts);
    if (hasFonts) {
      document.fonts.addEventListener('loadingdone', refresh);
      void document.fonts.ready?.then(refresh);
    }
    input.addEventListener('scroll', refresh);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(refresh);
      resizeObserver.observe(container);
    }

    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      if (hasFonts) {
        document.fonts.removeEventListener('loadingdone', refresh);
      }
      input.removeEventListener('scroll', refresh);
      resizeObserver?.disconnect();
    };
  }, [refresh]);

  return (
    <div className={cx('smooth-input', hasError && 'smooth-input--error', wrapperClassName)}>
      <div ref={containerRef} className="smooth-input__container">
        <input
          {...props}
          ref={inputRef}
          type={type}
          className={cx('smooth-input__field', className)}
          value={inputValue}
          onChange={(e) => {
            if (!isControlled) setInternalValue(e.target.value);
            onChange?.(e);
            requestAnimationFrame(refresh);
          }}
          onFocus={(e: FocusEvent<HTMLInputElement>) => {
            onFocus?.(e);
            requestAnimationFrame(refresh);
          }}
          onBlur={(e: FocusEvent<HTMLInputElement>) => {
            caretOpacity.set(0);
            onBlur?.(e);
          }}
        />
        <span ref={measureRef} aria-hidden className="smooth-input__measure" />
        <motion.div
          aria-hidden
          className="smooth-input__caret"
          style={{ x: springCaretX, opacity: caretOpacity }}
        />
      </div>
      {endAdornment}
    </div>
  );
}
