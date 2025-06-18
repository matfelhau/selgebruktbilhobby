import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "WordPress",
      credentials: {
        username: { label: "Bruker eller e-post", type: "text" },
        password: { label: "Passord", type: "password" },
      },
      async authorize(creds) {
        const res = await fetch(`${process.env.WP_URL}/wp-json/jwt-auth/v1/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: creds?.username,
            password: creds?.password,
          }),
        })
        const data = await res.json()
        if (res.ok && data.token) {
          return {
            id: data.user_id,
            name: data.user_display_name,
            email: data.user_email,
            wpToken: data.token,
          }
        }
        return null
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.wpToken = (user as any).wpToken
      return token
    },
    session({ session, token }) {
      ;(session as any).wpToken = (token as any).wpToken
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
