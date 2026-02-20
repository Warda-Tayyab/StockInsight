import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

const MOCK_ADMIN = {
  email: 'superadmin@stockinsight.sa',
  name: 'Super Admin',
  role: 'Owner',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = (email, _password) => {
    // Demo‑only auth: accept any credentials, but highlight the primary admin user
    const normalizedEmail = email?.trim().toLowerCase()

    if (normalizedEmail === MOCK_ADMIN.email) {
      setUser(MOCK_ADMIN)
    } else {
      setUser({
        email: normalizedEmail || 'admin@example.com',
        name: 'Super Admin',
        role: 'Owner',
      })
    }
  }

  const logout = () => {
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

