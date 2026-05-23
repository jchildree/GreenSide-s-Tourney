import { useState } from 'react'
import { Setup } from './views/Setup'
import { Draft } from './views/Draft'
import { Bracket } from './views/Bracket'
import { Control } from './views/Control'

type View = 'setup' | 'draft' | 'bracket' | 'control'

export function App(): JSX.Element {
  const [view, setView] = useState<View>('setup')

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '1rem' }}>
      <nav style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={() => setView('setup')}>Setup</button>
        <button onClick={() => setView('draft')}>Draft</button>
        <button onClick={() => setView('bracket')}>Bracket</button>
        <button onClick={() => setView('control')}>Control</button>
      </nav>
      {view === 'setup' && <Setup />}
      {view === 'draft' && <Draft />}
      {view === 'bracket' && <Bracket />}
      {view === 'control' && <Control />}
    </div>
  )
}
