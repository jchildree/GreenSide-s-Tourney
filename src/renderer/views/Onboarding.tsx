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
  const [status, setStatus] = useState<'idle' | 'waiting' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleConnect(): Promise<void> {
    setStatus('waiting')
    setErrorMsg('')
    try {
      await window.api.beginGoogleOAuth()
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

      <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        Grant access to your Google account so the app can read signup responses and update your form.
        A browser window will open for sign-in — you'll be redirected back automatically.
        Don't have an account?{' '}
        <a
          href="https://accounts.google.com/signup"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-silver)', textDecoration: 'underline', cursor: 'pointer' }}
        >
          Create one free
        </a>
        .
      </p>

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
            {status === 'waiting' ? 'Waiting for browser…' : 'Sign in with Google'}
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
  const [status, setStatus] = useState<'idle' | 'waiting' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleConnect(): Promise<void> {
    setStatus('waiting')
    setErrorMsg('')
    try {
      await window.api.beginChallongeOAuth()
      setStatus('done')
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

      <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        Grant access to your Challonge account so the app can create and manage your tournament brackets.
        A browser window will open for sign-in — you'll be redirected back automatically.
        Don't have an account?{' '}
        <a
          href="https://challonge.com/register"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-silver)', textDecoration: 'underline', cursor: 'pointer' }}
        >
          Register free
        </a>
        .
      </p>

      {status === 'waiting' && (
        <p style={{ color: 'var(--color-gold)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Browser opened — complete sign-in, then return here.
        </p>
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
            onClick={handleConnect}
            disabled={status === 'waiting'}
            className="btn-gold"
            style={{ flex: 1 }}
          >
            {status === 'waiting' ? 'Waiting for browser…' : 'Sign in with Challonge'}
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
