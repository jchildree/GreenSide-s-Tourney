import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { computeTeamCount, seededDistribute } from '../utils/draftModes'
import { GOOGLE_CREDENTIAL_EXPIRED, type Player, type Signups as SignupList, type Sync, type Tourney } from '../../shared/types'

/**
 * Step 2 — everything about the Google Form and its responses, lifted out of
 * the old Control view so the flow reads as one step per screen.
 */

const CARD: CSSProperties = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.85rem',
  padding: '1.375rem 1.5rem',
}

const EYEBROW: CSSProperties = {
  margin: 0,
  fontSize: '0.85rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-primary)',
}

const PRIMARY_BUTTON: CSSProperties = {
  padding: '0.65rem 1.25rem',
  borderRadius: '0.6rem',
  fontWeight: 700,
  fontSize: '0.9rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  color: 'var(--color-bg)',
  background: 'linear-gradient(160deg, var(--color-bright, var(--color-primary)) 0%, var(--color-primary) 45%, var(--color-deep, var(--color-primary)) 100%)',
  border: '1px solid var(--color-deep, var(--color-primary))',
  boxShadow: '0 0 14px rgba(var(--glow-rgb), 0.4)',
}

const GHOST_BUTTON: CSSProperties = {
  padding: '0.65rem 1.25rem',
  borderRadius: '0.6rem',
  fontWeight: 700,
  fontSize: '0.9rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  color: 'var(--color-silver)',
  background: 'transparent',
  border: '1px solid var(--color-border)',
}

function formViewUrl(formId: string): string {
  return `https://docs.google.com/forms/d/${formId}/viewform`
}

interface SignupsProps {
  onChanged?: () => void
}

export function Signups({ onChanged }: SignupsProps = {}): JSX.Element {
  const [formId, setFormId] = useState('')
  const [formIdSaved, setFormIdSaved] = useState(false)
  const [sync, setSync] = useState<Sync | null>(null)
  const [signups, setSignups] = useState<SignupList>([])
  const [tourney, setTourney] = useState<Tourney | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void Promise.all([window.api.getSync(), window.api.getSignups(), window.api.getTourney()]).then(([s, sg, t]) => {
      setSync(s)
      setSignups(sg)
      setTourney(t)
      if (s.googleFormId) setFormId(s.googleFormId)
    })
  }, [])

  function persistSignups(next: Player[]): void {
    setSignups(next)
    const save = (window.api as { saveSignups?: (s: Player[]) => Promise<void> }).saveSignups
    if (save) void save(next)
  }

  function handleReorder(event: DragEndEvent): void {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = signups.findIndex(p => p.name === active.id)
    const newIndex = signups.findIndex(p => p.name === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const reordered = arrayMove(signups, oldIndex, newIndex).map((p, i) => ({ ...p, seed: i }))
    persistSignups(reordered)
    onChanged?.()
  }

  const teamCount = computeTeamCount(signups.length, tourney?.teamSize ?? 4)
  const previewTeams = seededDistribute(signups, teamCount)

  const activeFormId = sync?.googleFormId ?? formId.trim()
  const googleExpired = error.includes(GOOGLE_CREDENTIAL_EXPIRED)

  async function handleSaveFormId(): Promise<void> {
    await window.api.setGoogleFormId(formId)
    setSync(s => (s ? { ...s, googleFormId: formId.trim() || null } : s))
    setFormIdSaved(true)
    setTimeout(() => setFormIdSaved(false), 2000)
  }

  const updateForm = useAsyncAction(async () => {
    await window.api.updateGoogleForm()
    setSync(await window.api.getSync())
    setError('')
    setStatus('Your form now shows the latest tournament details.')
  })

  const fetchSignups = useAsyncAction(async () => {
    const sg = await window.api.fetchSignups()
    setSignups(sg)
    setError('')
    setStatus(`${sg.length} signup${sg.length !== 1 ? 's' : ''} pulled in.`)
    onChanged?.()
  })

  const reconnectGoogle = useAsyncAction(async () => {
    await window.api.beginGoogleOAuth()
    setError('')
    setStatus('Google reconnected.')
  })

  useEffect(() => {
    const msg = updateForm.error || fetchSignups.error
    if (msg) setError(msg)
  }, [updateForm.error, fetchSignups.error])

  return (
    <div>
      <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 700 }}>Step 2 · Collect signups</h2>
      <p style={{ margin: '0 0 1.5rem', fontSize: '1rem', color: 'var(--color-silver)', textWrap: 'pretty' }}>
        Share your Google Form with players, then pull their responses in here.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(22rem, 1fr))', gap: '1.125rem', alignItems: 'start' }}>
        <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <p style={EYEBROW}>Your signup form</p>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}>
              Form ID — the long code in your form&rsquo;s web address
            </span>
            <span style={{ display: 'flex', gap: '0.625rem' }}>
              <input
                className="form-input"
                type="text"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                value={formId}
                onChange={e => setFormId(e.target.value)}
                style={{ flex: 1, fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem', minHeight: '2.5rem' }}
              />
              <button onClick={handleSaveFormId} style={GHOST_BUTTON}>
                {formIdSaved ? 'Saved' : 'Save'}
              </button>
            </span>
          </label>

          {activeFormId && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.55rem',
              padding: '0.7rem 0.875rem',
            }}>
              <span style={{
                flex: 1,
                fontSize: '0.875rem',
                color: 'var(--color-silver)',
                fontFamily: 'ui-monospace, monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {formViewUrl(activeFormId)}
              </span>
              <button
                onClick={() => void window.api.openExternal(formViewUrl(activeFormId))}
                style={{ ...GHOST_BUTTON, padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                Open
              </button>
            </div>
          )}

          <button
            onClick={updateForm.run}
            disabled={updateForm.loading || !activeFormId || googleExpired}
            style={{ ...GHOST_BUTTON, alignSelf: 'flex-start', opacity: !activeFormId || googleExpired ? 0.45 : 1 }}
          >
            {updateForm.loading ? 'Updating…' : 'Update form details'}
          </button>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
            This writes your tournament name, game and dates onto the form — so you never have to edit the form by hand.
          </p>
        </div>

        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
            <p style={{ ...EYEBROW, flex: 1 }}>Signups · {signups.length}</p>
            <button
              onClick={fetchSignups.run}
              disabled={fetchSignups.loading || !activeFormId || googleExpired}
              data-testid="fetch-signups"
              style={{ ...PRIMARY_BUTTON, opacity: !activeFormId || googleExpired ? 0.45 : 1 }}
            >
              {fetchSignups.loading ? 'Fetching…' : signups.length > 0 ? 'Refresh' : 'Fetch signups'}
            </button>
          </div>

          {signups.length > 0 ? (
            <>
              <p style={{ margin: '0 0 0.6rem', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                Drag to rank players. Top of the list is the strongest seed.
              </p>
              <DndContext onDragEnd={handleReorder}>
                <SortableContext items={signups.map(p => p.name)} strategy={verticalListSortingStrategy}>
                  <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '21rem', overflowY: 'auto' }}>
                    {signups.map((p, i) => (
                      <SignupRow key={p.name} player={p} index={i} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-muted)' }}>
              No signups yet — press &ldquo;Fetch signups&rdquo; once players have filled in the form.
            </p>
          )}
        </div>
      </div>

      {signups.length > 0 && (
        <div style={{ ...CARD, marginTop: '1.125rem' }}>
          <p style={EYEBROW}>Team preview - {teamCount} team{teamCount === 1 ? '' : 's'} of {tourney?.teamSize ?? 4}</p>
          <p style={{ margin: '0.5rem 0 1rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
            Read-only split from the current ranking. Adjust the order above to change it.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))', gap: '0.875rem' }}>
            {previewTeams.map(team => (
              <div key={team.name} style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '0.6rem',
                padding: '0.75rem 0.875rem',
              }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: 'var(--color-gold)', fontSize: '0.95rem' }}>{team.name}</p>
                <ol style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--color-silver)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {team.players.map(name => <li key={name}>{name}</li>)}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}

      {googleExpired && (
        <div style={{
          marginTop: '1.125rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          padding: '0.875rem 1rem',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.6rem',
          flexWrap: 'wrap',
        }}>
          <span style={{ color: '#f87171', fontSize: '0.95rem', flex: 1 }}>
            Your Google connection expired. Reconnect to keep going.
          </span>
          <button onClick={reconnectGoogle.run} disabled={reconnectGoogle.loading} style={PRIMARY_BUTTON}>
            {reconnectGoogle.loading ? 'Opening browser…' : 'Reconnect Google'}
          </button>
        </div>
      )}

      {!googleExpired && error && (
        <p className="status-err" style={{ marginTop: '1rem', fontSize: '0.95rem' }}>{error}</p>
      )}
      {status && !error && (
        <p className="status-ok" style={{ marginTop: '1rem', fontSize: '0.95rem' }}>{status}</p>
      )}
    </div>
  )
}

function SignupRow({ player, index }: { player: Player; index: number }): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: player.name })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: 'flex',
    gap: '0.875rem',
    alignItems: 'center',
    padding: '0.5rem 0.25rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    cursor: 'grab',
    background: isDragging ? 'var(--color-card)' : 'transparent',
    opacity: isDragging ? 0.85 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <span style={{
        fontFamily: 'ui-monospace, monospace',
        fontSize: '0.85rem',
        color: 'rgba(var(--glow-rgb), 0.55)',
        minWidth: '1.5rem',
        textAlign: 'right',
      }}>
        {index + 1}
      </span>
      <span style={{ flex: 1, fontSize: '0.97rem', fontWeight: 600, color: 'var(--color-text)' }}>{player.name}</span>
      <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>{player.discordHandle}</span>
    </div>
  )
}
