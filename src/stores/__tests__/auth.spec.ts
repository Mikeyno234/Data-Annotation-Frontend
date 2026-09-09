import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore, safeGetStorageJson } from '../auth'

vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    refreshToken: vi.fn(),
    getMe: vi.fn(),
  },
}))

describe('Auth Store & Storage Reliability', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('safeGetStorageJson', () => {
    it('returns parsed value for valid JSON', () => {
      localStorage.setItem('valid_key', JSON.stringify({ name: 'Alice' }))
      const result = safeGetStorageJson('valid_key', null)
      expect(result).toEqual({ name: 'Alice' })
    })

    it('returns fallback value and does not throw for corrupted JSON', () => {
      localStorage.setItem('corrupted_key', '{invalid-json')
      expect(() => {
        const result = safeGetStorageJson('corrupted_key', { fallback: true })
        expect(result).toEqual({ fallback: true })
      }).not.toThrow()
    })

    it('returns fallback when key is not found', () => {
      const result = safeGetStorageJson('non_existent', 'default')
      expect(result).toBe('default')
    })
  })

  describe('useAuthStore initialization', () => {
    it('initializes safely without crashing when localStorage has malformed JSON', () => {
      localStorage.setItem('annotation_auth_user', '{{bad-json}')
      localStorage.setItem('annotation_auth_org', 'undefined')
      localStorage.setItem('annotation_auth_perms', '[not-valid-json')

      let store: ReturnType<typeof useAuthStore> | null = null
      expect(() => {
        store = useAuthStore()
      }).not.toThrow()

      expect(store).not.toBeNull()
      expect(store!.user).toBeNull()
      expect(store!.organization).toBeNull()
      expect(store!.permissions).toEqual([])
      expect(store!.isAuthenticated).toBe(false)
    })
  })

  describe('logout token purge', () => {
    it('completely purges all access and refresh tokens from localStorage and sessionStorage', () => {
      localStorage.setItem('annotation_auth_token', 'access-token-local')
      localStorage.setItem('annotation_refresh_token', 'refresh-token-local')
      localStorage.setItem('annotation_auth_user', JSON.stringify({ id: 1, full_name: 'Test' }))
      localStorage.setItem('matrix_auth_token', 'legacy-access')
      localStorage.setItem('matrix_refresh_token', 'legacy-refresh')

      sessionStorage.setItem('annotation_auth_token', 'access-token-session')
      sessionStorage.setItem('annotation_refresh_token', 'refresh-token-session')

      const store = useAuthStore()
      expect(store.token).toBe('access-token-local')
      expect(store.refreshToken).toBe('refresh-token-local')

      store.logout()

      expect(store.token).toBeNull()
      expect(store.refreshToken).toBeNull()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)

      // Verify localStorage is clean
      expect(localStorage.getItem('annotation_auth_token')).toBeNull()
      expect(localStorage.getItem('annotation_refresh_token')).toBeNull()
      expect(localStorage.getItem('annotation_auth_user')).toBeNull()
      expect(localStorage.getItem('matrix_auth_token')).toBeNull()
      expect(localStorage.getItem('matrix_refresh_token')).toBeNull()

      // Verify sessionStorage is clean
      expect(sessionStorage.getItem('annotation_auth_token')).toBeNull()
      expect(sessionStorage.getItem('annotation_refresh_token')).toBeNull()
    })
  })
})
