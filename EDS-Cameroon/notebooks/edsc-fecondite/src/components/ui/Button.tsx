import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * Bouton unifié de l'application Hearth.
 * Garantit une apparence, une taille, des couleurs et un comportement cohérents
 * sur toutes les pages.
 *
 * Couleur de marque : dégradé indigo #6366F1 → #8B5CF6.
 */

export const BRAND_GRADIENT = 'linear-gradient(135deg,#6366F1,#8B5CF6)'
export const BRAND_PRIMARY  = '#6366F1'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children?: ReactNode
}

const SIZES: Record<Size, { height: number; padding: string; fontSize: number; gap: number }> = {
  sm: { height: 40, padding: '0 18px', fontSize: 13, gap: 6 },
  md: { height: 48, padding: '0 26px', fontSize: 14, gap: 8 },
  lg: { height: 52, padding: '0 32px', fontSize: 15, gap: 8 },
}

function Spinner({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 16, height: 16, borderRadius: '50%',
        border: `2px solid ${color}40`, borderTopColor: color,
        display: 'inline-block', animation: 'spin 0.7s linear infinite',
      }}
    />
  )
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const s = SIZES[size]
  const isDisabled = disabled || loading

  const palette: Record<Variant, { bg: string; color: string; border: string; shadow: string; hoverShadow: string }> = {
    primary:   { bg: BRAND_GRADIENT, color: 'white',     border: 'none',                  shadow: '0 6px 20px rgba(99,102,241,0.40)', hoverShadow: '0 10px 28px rgba(99,102,241,0.55)' },
    secondary: { bg: 'white',        color: BRAND_PRIMARY, border: '1.5px solid #E0E0F5', shadow: 'none',                              hoverShadow: '0 4px 14px rgba(99,102,241,0.18)' },
    ghost:     { bg: 'transparent',  color: '#64748B',   border: 'none',                  shadow: 'none',                              hoverShadow: 'none' },
    danger:    { bg: '#FEF2F2',      color: '#DC2626',   border: '1.5px solid #FECACA',   shadow: 'none',                              hoverShadow: '0 4px 14px rgba(220,38,38,0.15)' },
  }
  const p = palette[variant]

  return (
    <button
      {...rest}
      disabled={isDisabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: s.gap,
        height: s.height, padding: s.padding, width: fullWidth ? '100%' : undefined,
        background: isDisabled && variant === 'primary' ? '#A5B4FC' : p.bg,
        color: p.color, border: p.border, borderRadius: 999,
        fontSize: s.fontSize, fontWeight: 700, fontFamily: 'inherit',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        boxShadow: isDisabled ? 'none' : p.shadow,
        opacity: isDisabled && variant !== 'primary' ? 0.6 : 1,
        transition: 'all 0.2s ease', whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseOver={(e) => {
        if (isDisabled) return
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = p.hoverShadow
        if (variant === 'secondary') e.currentTarget.style.borderColor = BRAND_PRIMARY
        rest.onMouseOver?.(e)
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = isDisabled ? 'none' : p.shadow
        if (variant === 'secondary') e.currentTarget.style.borderColor = '#E0E0F5'
        rest.onMouseOut?.(e)
      }}
    >
      {loading ? <Spinner color={variant === 'primary' ? 'white' : BRAND_PRIMARY} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
}
