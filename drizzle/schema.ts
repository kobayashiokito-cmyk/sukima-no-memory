import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Photos table — スキマの記憶の写真データ
 */
export const photos = mysqlTable("photos", {
  id: int("id").autoincrement().primaryKey(),
  /** S3 URL or external image URL */
  src: text("src").notNull(),
  /** 一言コメント */
  comment: text("comment").notNull(),
  /** カテゴリID (customers, landscape, events, old-days, behind, community) */
  category: varchar("category", { length: 64 }).notNull(),
  /** 投稿者ニックネーム */
  nickname: varchar("nickname", { length: 100 }).default("名前なし"),
  /** だいたいの時期 */
  period: varchar("period", { length: 100 }),
  /** なつかしいカウント */
  natsukashii: int("natsukashii").default(0).notNull(),
  /** ユーザー投稿かどうか */
  isUserPost: int("isUserPost").default(0).notNull(),
  /** 投稿日時 */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;
