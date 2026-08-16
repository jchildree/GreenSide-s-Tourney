import { useEffect, useState } from 'react'
import { Sidebar, type View } from './components/Sidebar'
import { Home } from './views/Home'
import { Setup } from './views/Setup'
import { Signups } from './views/Signups'
import { Draft } from './views/Draft'
import { Bracket } from './views/Bracket'
import { Matches } from './views/Matches'
import { Settings } from './views/Settings'
import { Money } from './views/Money'
import { Onboarding } from './views/Onboarding'
import { useTournamentProgress } from './hooks/useTournamentProgress'
import { applyTheme } from './theme'
import { CRED, type ThemeId } from '../shared/types'

export function App(): JSX.Element {
  const [view, setView] = useState<View>('home')
  const [onboarded, setOnboarded] = useState<boolean | null>(null)
  const [theme, setTheme] = useState<ThemeId>('green')
  const [bgUrl, setBgUrl] = useState<string | null>(null)
  const [bgOpacity, setBgOpacity] = useState(35)
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null)
  const [challongeConnected, setChallongeConnected] = useState<boolean | null>(null)

  const progress = useTournamentProgress()

  useEffect(() => {
    void window.api.checkOnboarding().then(status => setOnboarded(status.complete))
  }, [])

  useEffect(() => {
    void window.api.getAppearance().then(a => {
      setTheme(a.theme)
      applyTheme(a.theme)
      setBgUrl(a.backgroundDataUrl)
      if (typeof a.backgroundOpacity === 'number') setBgOpacity(a.backgroundOpacity)
    })
  }, [])

  useEffect(() => {
    void Promise.all([
      window.api.getCredential(CRED.google),
      window.api.getCredential(CRED.challongeRefresh),
    ]).then(([g, c]) => {
      setGoogleConnected(g !== null)
      setChallongeConnected(c !== null)
    })
  }, [view])

  if (onboarded === null) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ color: 'var(--color-muted)', fontSize: '1rem' }}>Loading…</span>
      </div>
    )
  }

  if (!onboarded) {
    return <Onboarding onComplete={() => { setOnboarded(true); setView('home') }} />
  }

  function navigate(next: View): void {
    setView(next)
    void progress.reload()
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg)',
      color: 'var(--color-text)',
      display: 'flex',
    }}>
      {bgUrl && (
        <div
          aria-hidden
          data-testid="background-layer"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: bgOpacity / 100,
          }}
        />
      )}

      <Sidebar
        view={view}
        steps={progress.steps}
        onNavigate={navigate}
        googleConnected={googleConnected}
        challongeConnected={challongeConnected}
      />

      <main style={{
        flex: 1,
        padding: '2.25rem 2.75rem',
        overflowY: 'auto',
        position: 'relative',
        zIndex: 1,
        boxSizing: 'border-box',
      }}>
        <div style={{ width: '100%', maxWidth: '75rem', margin: '0 auto' }}>
          {view === 'home' && <Home progress={progress} onNavigate={navigate} />}
          {view === 'setup' && <Setup onSaved={() => { void progress.reload(); setView('signups') }} />}
          {view === 'signups' && <Signups onChanged={() => void progress.reload()} />}
          {view === 'draft' && <Draft onChanged={() => void progress.reload()} />}
          {view === 'publish' && <Bracket onChanged={() => void progress.reload()} />}
          {view === 'live' && <Matches />}
          {view === 'money' && <Money />}
          {view === 'settings' && (
            <Settings
              onCleared={() => { void progress.reload(); setView('home') }}
              theme={theme}
              onThemeChange={t => { setTheme(t); applyTheme(t) }}
              backgroundUrl={bgUrl}
              backgroundOpacity={bgOpacity}
              onBackgroundChange={setBgUrl}
              onBackgroundOpacityChange={setBgOpacity}
            />
          )}
        </div>
      </main>
    </div>
  )
}
