import type { DefaultSession } from '@auth/core/types'

declare module '@auth/core/types' {
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
  }
}

declare module '@auth/core/adapters' {
  interface AdapterUser {
    id: string
  }
}
