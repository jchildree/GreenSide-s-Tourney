import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { CARD, EYEBROW, VIEW_TITLE, VIEW_INTRO, PRIMARY_BUTTON, GHOST_BUTTON } from '../components/ui'
import type { Balances, PlayerBalance, Pot, Signups } from '../../shared/types'

function reconcile(signups: Signups, balances: Balances): Balances {
  const byName = new Map(balances.map(b => [b.name, b]))
  return signups.map(p => byName.get(p.name) ?? { name: p.name, owed: 0, paid: 0 })
}

function remaining(b: PlayerBalance): number {
  return b.owed - b.paid
}

const NUM_INPUT: CSSProperties = {
  width: '6rem',
  fontFamily: 'ui-monospace, monospace',
  fontSize: '0.9rem',
  minHeight: '2.25rem',
  textAlign: 'right',
}

export function Money(): JSX.Element {
  const [balances, setBalances] = useState<Balances>([])
  const [pot, setPot] = useState<Pot>({ total: 0 })
  const [amounts, setAmounts] = useState<Record<string, string>>({})

  useEffect(() => {
    void Promise.all([window.api.getSignups(), window.api.getBalances(), window.api.getPot()]).then(([sg, bal, p]) => {
      setBalances(reconcile(sg, bal))
      setPot(p)
    })
  }, [])

  function persistBalances(next: Balances): void {
    setBalances(next)
    void window.api.saveBalances(next)
  }

  function adjustOwed(name: string, delta: number): void {
    persistBalances(balances.map(b => (b.name === name ? { ...b, owed: b.owed + delta } : b)))
  }

  function setPaid(name: string, paid: number): void {
    persistBalances(balances.map(b => (b.name === name ? { ...b, paid } : b)))
  }

  function amountFor(name: string): number {
    const raw = Number(amounts[name])
    return Number.isFinite(raw) ? raw : 0
  }

  function persistPot(total: number): void {
    const next = { total }
    setPot(next)
    void window.api.savePot(next)
  }

  return (
    <div>
      <h2 style={VIEW_TITLE}>Money</h2>
      <p style={VIEW_INTRO}>
        Track what each player owes and the tournament pot. These two are independent -- the pot is whatever you set it to.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(28rem, 2fr) minmax(16rem, 1fr)', gap: '1.125rem', alignItems: 'start' }}>
        <div style={CARD}>
          <p style={EYEBROW}>Player ledger</p>
          {balances.length === 0 ? (
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.95rem', color: 'var(--color-muted)' }}>
              No signed-up players yet. Fetch signups first.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.75rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--color-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <th style={{ padding: '0.4rem 0.5rem' }}>Player</th>
                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>Owed</th>
                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>Adjust</th>
                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>Paid</th>
                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {balances.map(b => (
                  <tr key={b.name} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--color-text)' }}>{b.name}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'ui-monospace, monospace' }}>{b.owed}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', justifyContent: 'center' }}>
                        <button
                          onClick={() => adjustOwed(b.name, -amountFor(b.name))}
                          style={{ ...GHOST_BUTTON, padding: '0.35rem 0.7rem' }}
                          aria-label={`Subtract from ${b.name}`}
                        >
                          -
                        </button>
                        <input
                          className="form-input"
                          type="number"
                          value={amounts[b.name] ?? ''}
                          placeholder="0"
                          onChange={e => setAmounts(a => ({ ...a, [b.name]: e.target.value }))}
                          style={NUM_INPUT}
                        />
                        <button
                          onClick={() => adjustOwed(b.name, amountFor(b.name))}
                          style={{ ...GHOST_BUTTON, padding: '0.35rem 0.7rem' }}
                          aria-label={`Add to ${b.name}`}
                        >
                          +
                        </button>
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      <input
                        className="form-input"
                        type="number"
                        value={b.paid}
                        onChange={e => setPaid(b.name, Number(e.target.value) || 0)}
                        style={NUM_INPUT}
                      />
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'ui-monospace, monospace', color: remaining(b) > 0 ? 'var(--color-gold)' : 'var(--color-primary)' }}>
                      {remaining(b)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={CARD}>
          <p style={EYEBROW}>Tournament pot</p>
          <p style={{ margin: '0.5rem 0 1rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
            Set this to whatever the prize pool is. Not derived from the ledger.
          </p>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-silver)' }}>Total</span>
            <input
              className="form-input"
              type="number"
              value={pot.total}
              onChange={e => persistPot(Number(e.target.value) || 0)}
              style={{ ...NUM_INPUT, width: '100%', textAlign: 'left', fontSize: '1.3rem', fontWeight: 700 }}
            />
          </label>
          <button onClick={() => persistPot(pot.total)} style={{ ...PRIMARY_BUTTON, marginTop: '1rem', width: '100%' }}>
            Save pot
          </button>
        </div>
      </div>
    </div>
  )
}
