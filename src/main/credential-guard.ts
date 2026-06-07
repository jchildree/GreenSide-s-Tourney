import type { CredentialService } from '../shared/types'
import { deleteCredential } from './keychain'

export async function withCredentialGuard<T>(
  credKey: CredentialService,
  sentinel: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if ((err as Error).message === sentinel) deleteCredential(credKey)
    throw err
  }
}
