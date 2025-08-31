import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import "./types"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          // Call the API route for authentication
          const baseUrl = process.env.NEXTAUTH_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
          const response = await fetch(`${baseUrl}/api/auth/authorize`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          })

          if (!response.ok) {
            console.error('Auth response not OK:', response.status, response.statusText)
            return null
          }

          const user = await response.json()

          if (!user || !user.id) {
            console.error('Invalid user response:', user)
            return null
          }

          return {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            emailVerified: new Date() // Since we don't use email, we'll just set this
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  trustHost: true,
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        // Only set domain for production, not for localhost
        ...(process.env.NODE_ENV === 'production' && { domain: '.noahf.dev' }),
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        // Only use secure cookies in production (HTTPS)
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.username = user.username
        token.role = user.role
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.username = token.username
        session.user.role = token.role
      }
      return session
    }
  }
})
