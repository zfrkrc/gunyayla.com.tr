import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { pgTable, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core"

// ── Better Auth ────────────────────────────────────────────────
export const user = pgTable("user", {
  id:           text("id").primaryKey(),
  name:         text("name").notNull(),
  email:        text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image:        text("image"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  role:         text("role").default("reader"),
})

export const session = pgTable("session", {
  id:        text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token:     text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId:    text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (table) => [index("session_userId_idx").on(table.userId)])

export const account = pgTable("account", {
  id:                   text("id").primaryKey(),
  accountId:            text("account_id").notNull(),
  providerId:           text("provider_id").notNull(),
  userId:               text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken:          text("access_token"),
  refreshToken:         text("refresh_token"),
  idToken:              text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope:                text("scope"),
  password:             text("password"),
  createdAt:            timestamp("created_at").defaultNow().notNull(),
  updatedAt:            timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
}, (table) => [index("account_userId_idx").on(table.userId)])

export const verification = pgTable("verification", {
  id:         text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value:      text("value").notNull(),
  expiresAt:  timestamp("expires_at").notNull(),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
  updatedAt:  timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [index("verification_identifier_idx").on(table.identifier)])

// ── Galeri Albümleri ─────────────────────────────────────────
export const albums = pgTable("albums", {
  id:          text("id").primaryKey(),
  title:       text("title").notNull(),
  description: text("description"),
  coverImage:  text("cover_image"),
  slug:        text("slug").notNull().unique(),
  newsPostId:  text("news_post_id"),   // Ghost haber ID'si (opsiyonel bağlantı)
  createdBy:   text("created_by").notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
})

// ── Galeri Fotoğrafları ──────────────────────────────────────
export const photos = pgTable("photos", {
  id:        text("id").primaryKey(),
  albumId:   text("album_id").notNull().references(() => albums.id, { onDelete: "cascade" }),
  filename:  text("filename").notNull(),
  url:       text("url").notNull(),
  caption:   text("caption"),
  width:     integer("width"),
  height:    integer("height"),
  size:      integer("size"),
  order:     integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export type Album = typeof albums.$inferSelect
export type Photo = typeof photos.$inferSelect
export type NewAlbum = typeof albums.$inferInsert
export type NewPhoto = typeof photos.$inferInsert

const buildDatabaseUrl = () => {
  const host = process.env.POSTGRES_HOST
  const user = process.env.POSTGRES_USER
  const password = process.env.POSTGRES_PASSWORD
  const db = process.env.POSTGRES_DB
  const port = process.env.POSTGRES_PORT

  if (host && user && password && db && port) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}`
  }

  return process.env.DATABASE_URL ?? "postgresql://authuser:password@auth_db:5432/authdb"
}

const client = postgres(buildDatabaseUrl())
export const db = drizzle(client, {
  schema: { user, session, account, verification, albums, photos },
})
