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

// ── Reklam Alanları ──────────────────────────────────────────
export const ads = pgTable("ads", {
  id:               text("id").primaryKey(),
  title:            text("title").notNull(),
  category:         text("category").notNull(),
  description:      text("description"),
  price:            text("price"),
  dimensions:       text("dimensions"),
  mobileDimensions: text("mobile_dimensions"),
  channelTag:       text("channel_tag"),
  platform:         text("platform").default("all"),
  imageUrl:         text("image_url"),
  sortOrder:        integer("sort_order").default(0),
  status:           text("status").default("active"),
  createdAt:        timestamp("created_at").defaultNow().notNull(),
  updatedAt:        timestamp("updated_at").defaultNow().notNull(),
})

// ── Reklam Kampanyaları ──────────────────────────────────────
export const adCampaigns = pgTable("ad_campaigns", {
  id:             text("id").primaryKey(),
  adId:           text("ad_id").notNull().references(() => ads.id, { onDelete: "cascade" }),
  clientName:     text("client_name"),
  clientContact:  text("client_contact"),
  startDate:      timestamp("start_date"),
  durationMonths: integer("duration_months"),
  priceAgreed:    text("price_agreed"),
  bannerUrl:      text("banner_url"),
  bannerMobileUrl: text("banner_mobile_url"),
  linkUrl:        text("link_url"),
  notes:          text("notes"),
  status:         text("status").default("active"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
})

export type Album = typeof albums.$inferSelect
export type Photo = typeof photos.$inferSelect
export type NewAlbum = typeof albums.$inferInsert
export type NewPhoto = typeof photos.$inferInsert
export type Ad = typeof ads.$inferSelect
export type NewAd = typeof ads.$inferInsert
export type AdCampaign = typeof adCampaigns.$inferSelect
export type NewAdCampaign = typeof adCampaigns.$inferInsert

// ── Yorumlar ──────────────────────────────────────────────
export const comments = pgTable("comments", {
  id:        text("id").primaryKey(),
  postId:    text("post_id").notNull(),
  name:      text("name").notNull(),
  email:     text("email"),
  content:   text("content").notNull(),
  parentId:  text("parent_id"),
  status:    text("status").default("approved"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("comments_postId_idx").on(table.postId),
  index("comments_parentId_idx").on(table.parentId),
])

// ── Geri Bildirim (beğeni/beğenmeme) ──────────────────────
export const postFeedback = pgTable("post_feedback", {
  id:        text("id").primaryKey(),
  postId:    text("post_id").notNull(),
  email:     text("email"),
  score:     integer("score").notNull(), // 1 = like, 0 = dislike
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("feedback_postId_idx").on(table.postId),
])

// ── Haber Gönder (okur başvurusu) ────────────────────────
export const newsSubmissions = pgTable("news_submissions", {
  id:        text("id").primaryKey(),
  name:      text("name").notNull(),
  email:     text("email"),
  phone:     text("phone"),
  title:     text("title").notNull(),
  content:   text("content").notNull(),
  status:    text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("news_submissions_status_idx").on(table.status),
])

export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
export type PostFeedback = typeof postFeedback.$inferSelect
export type NewPostFeedback = typeof postFeedback.$inferInsert
export type NewsSubmission = typeof newsSubmissions.$inferSelect
export type NewNewsSubmission = typeof newsSubmissions.$inferInsert

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
  schema: { user, session, account, verification, albums, photos, ads, adCampaigns, comments, postFeedback, newsSubmissions },
})
