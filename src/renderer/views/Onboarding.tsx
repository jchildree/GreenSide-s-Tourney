import { useState } from 'react'

type Step = 'welcome' | 'google' | 'challonge' | 'done'

interface OnboardingProps {
  onComplete: () => void
}

export function Onboarding({ onComplete }: OnboardingProps): JSX.Element {
  const [step, setStep] = useState<Step>('welcome')

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '0.75rem',
        padding: '2.5rem',
      }}>
        <StepIndicator current={step} />
        {step === 'welcome'   && <WelcomeStep   onNext={() => setStep('google')} />}
        {step === 'google'    && <GoogleStep    onNext={() => setStep('challonge')} />}
        {step === 'challonge' && <ChallongeStep onNext={() => setStep('done')} />}
        {step === 'done'      && <DoneStep      onFinish={onComplete} />}
      </div>
    </div>
  )
}

/* ── Step indicator ─────────────────────────────────── */

const STEPS: Step[] = ['welcome', 'google', 'challonge', 'done']

function StepIndicator({ current }: { current: Step }): JSX.Element {
  const idx = STEPS.indexOf(current)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '1.75rem',
            height: '1.75rem',
            borderRadius: '50%',
            backgroundColor: i <= idx ? 'var(--color-gold)' : 'var(--color-border)',
            color: i <= idx ? '#020817' : 'var(--color-muted)',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {i < idx ? '✓' : String(i + 1)}
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              flex: 1,
              height: '2px',
              width: '2rem',
              backgroundColor: i < idx ? 'var(--color-gold)' : 'var(--color-border)',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Welcome step ───────────────────────────────────── */

function WelcomeStep({ onNext }: { onNext: () => void }): JSX.Element {
  return (
    <div>
      <h1 style={{ color: 'var(--color-gold)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Welcome to Tourney App
      </h1>
      <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
        This one-time setup connects two services so you can run tournaments end-to-end:
      </p>
      <ul style={{ color: 'var(--color-text)', fontSize: '0.875rem', lineHeight: 2, marginBottom: '2rem', paddingLeft: '1.25rem' }}>
        <li><strong style={{ color: 'var(--color-gold)' }}>Google</strong> — reads your signup form responses and updates form fields</li>
        <li><strong style={{ color: 'var(--color-gold)' }}>Challonge</strong> — pushes finalized teams to your bracket</li>
      </ul>
      <button onClick={onNext} className="btn-gold" style={{ width: '100%' }}>
        Get Started
      </button>
    </div>
  )
}

/* ── Google step ────────────────────────────────────── */

function GoogleStep({ onNext }: { onNext: () => void }): JSX.Element {
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [status, setStatus] = useState<'idle' | 'waiting' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleConnect(): Promise<void> {
    if (!clientId.trim() || !clientSecret.trim()) {
      setErrorMsg('Both Client ID and Client Secret are required.')
      setStatus('error')
      return
    }
    setStatus('waiting')
    setErrorMsg('')
    try {
      await window.api.beginGoogleOAuth(clientId.trim(), clientSecret.trim())
      setStatus('done')
    } catch (err) {
      setErrorMsg((err as Error).message)
      setStatus('error')
    }
  }

  return (
    <div>
      <h2 style={{ color: 'var(--color-gold)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Connect Google
      </h2>

      <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
        You need a Google Cloud project with the{' '}
        <strong style={{ color: 'var(--color-text)' }}>Google Forms API</strong> enabled
        and an OAuth 2.0 client (type: <em>Desktop app</em>).{' '}
        <a
          href="https://console.cloud.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-gold)', textDecoration: 'underline', cursor: 'pointer' }}
        >
          Open Google Cloud Console
        </a>
        {' '}or{' '}
        <a
          href="https://accounts.google.com/signup"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-silver)', textDecoration: 'underline', cursor: 'pointer' }}
        >
          create a Google account first
        </a>
        .
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>OAuth Client ID</label>
          <input
            className="form-input"
            type="text"
            placeholder="123456789-abc...apps.googleusercontent.com"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            disabled={status === 'waiting' || status === 'done'}
          />
        </div>
        <div>
          <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>OAuth Client Secret</label>
          <input
            className="form-input"
            type="password"
            placeholder="GOCSPX-..."
            value={clientSecret}
            onChange={e => setClientSecret(e.target.value)}
            disabled={status === 'waiting' || status === 'done'}
          />
        </div>
      </div>

      {status === 'waiting' && (
        <p style={{ color: 'var(--color-gold)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Browser opened — complete sign-in, then return here.
        </p>
      )}
      {status === 'error' && (
        <p className="status-err" style={{ marginBottom: '1rem' }}>{errorMsg}</p>
      )}
      {status === 'done' && (
        <p className="status-ok" style={{ marginBottom: '1rem' }}>Google connected successfully.</p>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {status !== 'done' ? (
          <button
            onClick={handleConnect}
            disabled={status === 'waiting'}
            className="btn-gold"
            style={{ flex: 1 }}
          >
            {status === 'waiting' ? 'Waiting for browser…' : 'Connect Google Account'}
          </button>
        ) : (
          <button onClick={onNext} className="btn-gold" style={{ flex: 1 }}>
            Continue
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Challonge step ─────────────────────────────────── */

function ChallongeStep({ onNext }: { onNext: () => void }): JSX.Element {
  const [apiKey, setApiKey] = useState('')
  const [communityUrl, setCommunityUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'verifying' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleVerify(): Promise<void> {
    if (!apiKey.trim()) {
      setErrorMsg('API key is required.')
      setStatus('error')
      return
    }
    setStatus('verifying')
    setErrorMsg('')
    try {
      const valid = await window.api.verifyChallongeKey(apiKey.trim(), communityUrl.trim())
      if (valid) {
        setStatus('done')
      } else {
        setErrorMsg('Invalid API key — Challonge returned an error. Double-check and try again.')
        setStatus('error')
      }
    } catch (err) {
      setErrorMsg((err as Error).message)
      setStatus('error')
    }
  }

  return (
    <div>
      <h2 style={{ color: 'var(--color-gold)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Connect Challonge
      </h2>

      <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
        Find your API key at{' '}
        <a
          href="https://challonge.com/settings#api-section"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-gold)', textDecoration: 'underline', cursor: 'pointer' }}
        >
          challonge.com/settings → Developer API
        </a>
        . Don't have an account?{' '}
        <a
          href="https://challonge.com/register"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-silver)', textDecoration: 'underline', cursor: 'pointer' }}
        >
          Register free
        </a>
        . Need a community?{' '}
        <a
          href="https://challonge.com/communities/new"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-silver)', textDecoration: 'underline', cursor: 'pointer' }}
        >
          Create one
        </a>
        .
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>API Key</label>
          <input
            className="form-input"
            type="password"
            placeholder="Paste your Challonge API key"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            disabled={status === 'verifying' || status === 'done'}
          />
        </div>
        <div>
          <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>
            Community URL{' '}
            <span style={{ color: 'var(--color-muted)', fontWeight: 400, textTransform: 'none', fontSize: '0.7rem' }}>
              (optional)
            </span>
          </label>
          <input
            className="form-input"
            type="text"
            placeholder="https://challonge.com/communities/yourname"
            value={communityUrl}
            onChange={e => setCommunityUrl(e.target.value)}
            disabled={status === 'verifying' || status === 'done'}
          />
        </div>
      </div>

      {status === 'verifying' && (
        <p style={{ color: 'var(--color-gold)', fontSize: '0.85rem', marginBottom: '1rem' }}>Verifying with Challonge…</p>
      )}
      {status === 'error' && (
        <p className="status-err" style={{ marginBottom: '1rem' }}>{errorMsg}</p>
      )}
      {status === 'done' && (
        <p className="status-ok" style={{ marginBottom: '1rem' }}>Challonge connected successfully.</p>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {status !== 'done' ? (
          <button
            onClick={handleVerify}
            disabled={status === 'verifying'}
            className="btn-gold"
            style={{ flex: 1 }}
          >
            {status === 'verifying' ? 'Verifying…' : 'Verify & Save Key'}
          </button>
        ) : (
          <button onClick={onNext} className="btn-gold" style={{ flex: 1 }}>
            Continue
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Done step ──────────────────────────────────────── */

function DoneStep({ onFinish }: { onFinish: () => void }): JSX.Element {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
      <h2 style={{ color: 'var(--color-gold)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem' }}>
        All Set!
      </h2>
      <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '2rem' }}>
        Google and Challonge are connected. You're ready to run your first tournament.
      </p>
      <button onClick={onFinish} className="btn-gold" style={{ width: '100%' }}>
        Open Dashboard
      </button>
    </div>
  )
}
