import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  full?: boolean;
}

const baseButtonStyle: CSSProperties = {
  appearance: 'none',
  WebkitAppearance: 'none',
  borderRadius: 16,
  minHeight: 46,
  padding: '0 18px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  fontWeight: 720,
  letterSpacing: '-0.01em',
  lineHeight: 1,
  textAlign: 'center',
  textDecoration: 'none',
  cursor: 'pointer',
  userSelect: 'none',
  whiteSpace: 'nowrap',
  transition: 'transform .18s ease, box-shadow .18s ease, opacity .18s ease, border-color .18s ease, background .18s ease'
};

const variantButtonStyle: Record<Variant, CSSProperties> = {
  primary: {
    color: '#ffffff',
    border: '1px solid rgba(120, 158, 255, .48)',
    background: 'linear-gradient(135deg, #2f7dff 0%, #6f56ff 52%, #9b5dff 100%)',
    boxShadow: '0 16px 42px rgba(47, 125, 255, .26), inset 0 1px 0 rgba(255, 255, 255, .2)'
  },
  secondary: {
    color: '#f6f8ff',
    border: '1px solid rgba(255, 255, 255, .16)',
    background: 'linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.065))',
    boxShadow: '0 12px 30px rgba(0, 0, 0, .18), inset 0 1px 0 rgba(255,255,255,.08)'
  },
  ghost: {
    color: '#cbd7ff',
    border: '1px solid rgba(185, 198, 255, .22)',
    background: 'rgba(255, 255, 255, .035)',
    boxShadow: 'none'
  },
  danger: {
    color: '#ffd5d5',
    border: '1px solid rgba(255, 84, 84, .28)',
    background: 'linear-gradient(180deg, rgba(255,84,84,.2), rgba(255,84,84,.12))',
    boxShadow: '0 12px 30px rgba(255, 84, 84, .12)'
  }
};

function getButtonStyle(variant: Variant, full?: boolean, disabled?: boolean, style?: CSSProperties): CSSProperties {
  return {
    ...baseButtonStyle,
    ...variantButtonStyle[variant],
    width: full ? '100%' : undefined,
    opacity: disabled ? .5 : undefined,
    pointerEvents: disabled ? 'none' : undefined,
    ...style
  };
}

export function Button({ children, variant = 'primary', full, className = '', style, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${full ? styles.full : ''} ${className}`}
      disabled={disabled}
      style={getButtonStyle(variant, full, disabled, style)}
      {...props}
    >
      {children}
    </button>
  );
}

interface ButtonLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  children: ReactNode;
  href: string;
  variant?: Variant;
  full?: boolean;
}

export function ButtonLink({ children, href, variant = 'primary', full, className = '', style, ...props }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`${styles.button} ${styles[variant]} ${full ? styles.full : ''} ${className}`}
      style={getButtonStyle(variant, full, Boolean(props['aria-disabled']), style)}
      {...props}
    >
      {children}
    </Link>
  );
}
