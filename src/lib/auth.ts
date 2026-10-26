import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// Google is the only sign-in method. Its callback URL is <BETTER_AUTH_URL>/api/auth/callback/google.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: { cookieCache: { enabled: true, maxAge: 60 } },
});

export async function getSession() {
  return auth.api.getSession({ headers: headers() });
}
