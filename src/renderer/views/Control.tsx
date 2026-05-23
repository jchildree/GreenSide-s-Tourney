import { useState } from 'react'

export function Control(): JSX.Element {
  const [status, setStatus] = useState('')

  async function handleUpdateForm(): Promise<void> {
    try {
      await window.api.updateGoogleForm()
      setStatus('Google Form updated.')
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`)
    }
  }

  async function handleFetchSignups(): Promise<void> {
    try {
      const signups = await window.api.fetchSignups()
      setStatus(`Fetched ${signups.length} signups.`)
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`)
    }
  }

  return (
    <div>
      <h2>Tournament Control</h2>
      <button onClick={handleUpdateForm}>Update Google Form</button>
      <button onClick={handleFetchSignups} style={{ marginLeft: '1rem' }}>Fetch Signups</button>
      {status && <p>{status}</p>}
    </div>
  )
}
