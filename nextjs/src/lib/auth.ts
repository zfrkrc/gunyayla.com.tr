import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { db, user } from "./db"
import { sendVerificationEmail, sendResetPasswordEmail } from "./email"
import { syncGhostMember } from "./ghost"

const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.SITE_DOMAIN ? `http://${process.env.SITE_DOMAIN}` : "http://localhost:8060")

const secret = process.env.BETTER_AUTH_SECRET || "dev-better-auth-secret"

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),

  baseURL,
  secret,

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      const trUrl = url.replace(/\/reset-password\//, "/sifre-sifirla/")
      await sendResetPasswordEmail(user.email, trUrl)
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const vUrl = url.replace(/\/verify-email/, "/email-dogrula")
      await sendVerificationEmail(user.email, vUrl)
    },
  },

  socialProviders: {
    google: {
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "reader",
        input: false,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge:  60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge:  5 * 60,
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (newUser, context) => {
          if (newUser.email) {
            try {
              const ip = context?.getHeader?.("x-forwarded-for")?.split(",")[0]?.trim()
              const prefix = ip ? "Kayit IP: " + ip : "Kayit"
              await syncGhostMember(newUser.email, newUser.name || newUser.email.split("@")[0], prefix)
            } catch (e) {
              console.error("[GHOST-SYNC] user.create error:", e)
            }
          }
        },
      },
    },
    session: {
      create: {
        after: async (newSession) => {
          try {
            const rows = await db
              .select({ email: user.email, name: user.name })
              .from(user)
              .where(eq(user.id, newSession.userId))
              .limit(1)
            if (rows.length > 0) {
              const u = rows[0]
              const ip = newSession.ipAddress
              const prefix = ip ? "Giris IP: " + ip : "Giris"
              await syncGhostMember(u.email, u.name || u.email.split("@")[0], prefix)
            }
          } catch (e) {
            console.error("[GHOST-SYNC] session.create error:", e)
          }
        },
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session

export async function checkAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Yasak" }, { status: 403 })
  return null
}
