import { useState, useCallback, useRef } from 'react'

interface AsyncActionResult {
  run: () => Promise<void>
  loading: boolean
  error: string
  clearError: () => void
}

export function useAsyncAction(fn: () => Promise<void>): AsyncActionResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fnRef = useRef(fn)
  fnRef.current = fn

  const run = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      await fnRef.current()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => setError(''), [])

  return { run, loading, error, clearError }
}
