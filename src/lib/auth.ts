import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    async signIn({ user }) {
      const allowed = process.env.ALLOWED_EMAIL;
      if (!allowed) return true; // no restriction configured — anyone with a Google account can sign in
      // Comma-separated list — each allowed account gets fully isolated data
      // (see prisma/schema.prisma's userEmail fields), so this just controls
      // who's allowed in the door, not who can see whose reminders.
      const allowedList = allowed.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
      return allowedList.includes(user.email?.toLowerCase() ?? '');
    },
  },
};
