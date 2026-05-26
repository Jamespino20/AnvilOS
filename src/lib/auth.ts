/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 24, 2026
*/

import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { verifyTotp } from "@/lib/totp";

class TotpRequired extends CredentialsSignin {
  code = "TOTP_REQUIRED";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        totp: { label: "Authenticator Code", type: "text" },
      },
      async authorize(credentials) {
        console.log("Auth attempt for:", credentials?.username);

        if (!credentials?.username || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        const identifier = credentials.username as string;
        const password = credentials.password as string;

        try {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { username: { equals: identifier, mode: "insensitive" } },
                { email: { equals: identifier, mode: "insensitive" } },
              ],
            },
          });

          if (!user) {
            console.log("User not found:", identifier);
            return null;
          }

          let isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid && user.oldPasswordHash) {
            isValid = await bcrypt.compare(password, user.oldPasswordHash);
          }
          if (!isValid) {
            console.log("Invalid password for:", identifier);
            return null;
          }

          if (!user.isActive) {
            console.log("User inactive:", identifier);
            return null;
          }

          if (user.totpEnabled) {
            const code = String((credentials as any).totp || "");
            if (!user.totpSecret || !verifyTotp(user.totpSecret, code)) {
              console.log("TOTP required for:", identifier);
              throw new TotpRequired();
            }
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          return {
            id: String(user.id),
            name: user.sellerName,
            email: user.email,
            username: user.username,
            role: user.role,
          };
        } catch (error) {
          console.error("Database error during authorize:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      try {
        if (user) {
          token.sub = user.id;
          token.name = user.name;
          token.email = user.email;
          token.username = (user as any).username;
          token.sellerId = Number(user.id);
          token.role = (user as any).role || "STAFF";
        }
        if (trigger === "update" && session) {
          if (session.name) token.name = session.name;
        }
        return token;
      } catch (error) {
        console.error("JWT Callback Error:", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user && token) {
          session.user.id = token.sub as string;
          (session.user as any).username = token.username as string;
          (session.user as any).sellerId = token.sellerId as number;
          (session.user as any).role = token.role as string;
          try {
            const u = await prisma.user.findUnique({
              where: { id: Number(token.sub) },
              select: { imageUrl: true, role: true, totpEnabled: true },
            });
            (session.user as any).imageUrl = u?.imageUrl ?? null;
            (session.user as any).role = u?.role ?? token.role ?? "STAFF";
            (session.user as any).totpEnabled = u?.totpEnabled ?? false;
          } catch {
            (session.user as any).imageUrl = null;
          }
        }
        return session;
      } catch (error) {
        console.error("Session Callback Error:", error);
        return session;
      }
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});




