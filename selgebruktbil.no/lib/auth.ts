import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "WordPress",
      credentials: {
        username: { label: "Bruker eller e-post", type: "text" },
        password: { label: "Passord", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const res = await fetch(`${process.env.WP_URL}/wp-json/jwt-auth/v1/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
          }),
        });

        if (!res.ok) return null;

        const data = await res.json();

        if (data.token) {
          return {
            id: data.user_id,
            name: data.user_display_name,
            email: data.user_email,
            wpToken: data.token,
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.wpToken = (user as any).wpToken;
      return token;
    },
    session({ session, token }) {
      (session as any).wpToken = (token as any).wpToken;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
