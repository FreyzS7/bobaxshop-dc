import type { NextAuthConfig } from "next-auth"

// Config ini TIDAK boleh import modul Node.js (pg, bcrypt, dll)
// Digunakan di proxy.ts (Edge Runtime)
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as "superadmin" | "viewer"
      return session
    },
  },
  providers: [],
}
