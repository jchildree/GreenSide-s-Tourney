interface ReconnectBannerProps {
  service: 'Google' | 'Challonge'
  onReconnect: () => void
  loading: boolean
}

/**
 * One banner for every expired-credential case, in plain language.
 * Replaces the four near-identical copies that were inline in the old views.
 */
export function ReconnectBanner({ service, onReconnect, loading }: ReconnectBannerProps): JSX.Element {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.875rem',
      padding: '0.875rem 1rem',
      background: 'rgba(239, 68, 68, 0.08)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '0.6rem',
      flexWrap: 'wrap',
    }}>
      <span style={{ color: '#f87171', fontSize: '0.95rem', flex: 1, minWidth: '14rem' }}>
        Your {service} connection expired. Reconnect to keep going.
      </span>
      <button
        onClick={onReconnect}
        disabled={loading}
        style={{
          padding: '0.6rem 1.15rem',
          borderRadius: '0.55rem',
          fontWeight: 700,
          fontSize: '0.85rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          color: '#ffffff',
          background: '#e94560',
          border: '1px solid #e94560',
        }}
      >
        {loading ? 'Opening browser…' : `Reconnect ${service}`}
      </button>
    </div>
  )
}
