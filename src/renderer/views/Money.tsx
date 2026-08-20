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

function sum(balances: Balances, key: 'owed' | 'paid'): number {
  return balances.reduce((t, b) => t + (b[key] || 0), 0)
}

const CHIPS = [5, 10, 20]

const NUM_INPUT: CSSProperties = {
  width: '5.5rem',
  fontFamily: 'ui-monospace, monospace',
  fontSize: '0.9rem',
  minHeight: '2.25rem',
  textAlign: 'right',
}

const CHIP: CSSProperties = {
  ...GHOST_BUTTON,
  padding: '0.2rem 0.45rem',
  fontSize: '0.75rem',
  minHeight: 'auto',
}

export function Money(): JSX.Element {
  const [balances, setBalances] = useState<Balances>([])
  const [pot, setPot] = useState<Pot>({ total: 0 })
  const [potInput, setPotInput] = useState<string>('')
  const [owedInputs, setOwedInputs] = useState<Record<string, string>>({})
  const [paidInputs, setPaidInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    void Promise.all([window.api.getSignups(), window.api.getBalances(), window.api.getPot()]).then(([sg, bal, p]) => {
      const reconciled = reconcile(sg, bal)
      setBalances(reconciled)
      setPot(p)
      setPotInput(p.total > 0 ? String(p.total) : '')
      setOwedInputs(Object.fromEntries(reconciled.map(b => [b.name, String(b.owed)])))
      setPaidInputs(Object.fromEntries(reconciled.map(b => [b.name, String(b.paid)])))
    })
  }, [])

  function persistBalances(next: Balances): void {
    setBalances(next)
    void window.api.saveBalances(next)
  }

  function setField(name: string, field: 'owed' | 'paid', value: number): void {
    persistBalances(balances.map(b => (b.name === name ? { ...b, [field]: Math.max(0, value) } : b)))
  }

  function bumpOwed(name: string, delta: number): void {
    const b = balances.find(x => x.name === name)
    const next = Math.max(0, (b?.owed ?? 0) + delta)
    setOwedInputs(o => ({ ...o, [name]: String(next) }))
    setField(name, 'owed', next)
  }

  const collected = sum(balances, 'paid')
  const potential = sum(balances, 'owed')
  const manual = pot.total > 0 ? pot.total : null
  const effectivePot = manual ?? collected

  function persistPot(total: number): void {
    const next = { total: Math.max(0, total) }
    setPot(next)
    setPotInput(next.total > 0 ? String(next.total) : '')
    void window.api.savePot(next)
  }

  return (
    <div>
      <h2 style={VIEW_TITLE}>Money</h2>
      <p style={VIEW_INTRO}>
        Track what each player owes and pays. The pot is the collected total (what has been paid), unless you set a manual override.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(15rem, 1fr)', gap: '1.125rem', alignItems: 'start' }}>
        <div style={{ ...CARD, minWidth: 0 }}>
          <p style={EYEBROW}>Player ledger</p>
          {balances.length === 0 ? (
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.95rem', color: 'var(--color-muted)' }}>
              No signed-up players yet. Fetch signups first.
            </p>
          ) : (
            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', marginTop: '0.75rem' }}>
              <colgroup>
                <col />
                <col style={{ width: '11rem' }} />
                <col style={{ width: '7rem' }} />
                <col style={{ width: '6rem' }} />
              </colgroup>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--color-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <th style={{ padding: '0.4rem 0.5rem' }}>Player</th>
                  <th style={{ padding: '0.4rem 0.5rem' }}>Owed</th>
                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>Paid</th>
                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {balances.map(b => (
                  <tr key={b.name} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--color-text)', overflowWrap: 'anywhere' }}>{b.name}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <input
                        className="form-input"
                        type="number"
                        value={owedInputs[b.name] ?? String(b.owed)}
                        onChange={e => setOwedInputs(o => ({ ...o, [b.name]: e.target.value }))}
                        onBlur={e => setField(b.name, 'owed', Number(e.target.value) || 0)}
                        style={NUM_INPUT}
                        aria-label={`Owed by ${b.name}`}
                      />
                      <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                        {CHIPS.map(c => (
                          <button key={c} onClick={() => bumpOwed(b.name, c)} style={CHIP} aria-label={`Add ${c} to ${b.name}`}>
                            +{c}
                          </button>
                        ))}
                        <button onClick={() => bumpOwed(b.name, -Infinity)} style={CHIP} aria-label={`Clear owed for ${b.name}`}>
                          clear
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      <input
                        className="form-input"
                        type="number"
                        value={paidInputs[b.name] ?? String(b.paid)}
                        onChange={e => setPaidInputs(p => ({ ...p, [b.name]: e.target.value }))}
                        onBlur={e => setField(b.name, 'paid', Number(e.target.value) || 0)}
                        style={NUM_INPUT}
                        aria-label={`Paid by ${b.name}`}
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

        <div style={{ ...CARD, minWidth: 0 }}>
          <p style={EYEBROW}>Tournament pot</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0.75rem 0 1rem' }}>
            <PotRow label="Collected (paid)" value={collected} accent="var(--color-primary)" />
            <PotRow label="Potential (owed)" value={potential} accent="var(--color-gold)" />
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-silver)' }}>Manual override</span>
            <input
              className="form-input"
              type="number"
              value={potInput}
              placeholder={`blank = collected (${collected})`}
              onChange={e => setPotInput(e.target.value)}
              onBlur={e => persistPot(Number(e.target.value) || 0)}
              style={{ ...NUM_INPUT, width: '100%', textAlign: 'left', fontSize: '1.15rem', fontWeight: 700 }}
            />
          </label>
          <button onClick={() => persistPot(Number(potInput) || 0)} style={{ ...PRIMARY_BUTTON, marginTop: '1rem', width: '100%' }}>
            Save pot
          </button>

          <p style={{ margin: '1rem 0 0', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Effective pot: <strong style={{ color: 'var(--color-text)', fontFamily: 'ui-monospace, monospace' }}>{effectivePot}</strong>
            {manual === null && ' (from collected)'}
          </p>
        </div>
      </div>
    </div>
  )
}

function PotRow({ label, value, accent }: { label: string; value: number; accent: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: accent }}>{value}</span>
    </div>
  )
}
