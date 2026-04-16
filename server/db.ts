import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, photos, InsertPhoto, Photo } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== Photo Queries ==========

/** Get all photos, optionally filtered by category */
export async function getPhotos(category?: string): Promise<Photo[]> {
  const db = await getDb();
  if (!db) return [];

  if (category) {
    return db.select().from(photos).where(eq(photos.category, category)).orderBy(desc(photos.createdAt));
  }
  return db.select().from(photos).orderBy(desc(photos.createdAt));
}

/** Get random photos */
export async function getRandomPhotos(count: number = 6): Promise<Photo[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(photos).orderBy(sql`RAND()`).limit(count);
}

/** Create a new photo */
export async function createPhoto(photo: InsertPhoto): Promise<Photo> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(photos).values(photo);
  const insertId = result[0].insertId;
  const rows = await db.select().from(photos).where(eq(photos.id, insertId)).limit(1);
  return rows[0];
}

/** Increment natsukashii count */
export async function incrementNatsukashii(photoId: number): Promise<Photo | null> {
  const db = await getDb();
  if (!db) return null;

  await db.update(photos).set({ natsukashii: sql`${photos.natsukashii} + 1` }).where(eq(photos.id, photoId));
  const rows = await db.select().from(photos).where(eq(photos.id, photoId)).limit(1);
  return rows[0] || null;
}

/** Delete a photo by ID */
export async function deletePhoto(photoId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.delete(photos).where(eq(photos.id, photoId));
  return (result[0] as any).affectedRows > 0;
}

/** Update a photo's editable fields */
export async function updatePhoto(
  photoId: number,
  data: { comment?: string; category?: string; nickname?: string; period?: string | null }
): Promise<Photo | null> {
  const db = await getDb();
  if (!db) return null;

  const updateSet: Record<string, unknown> = {};
  if (data.comment !== undefined) updateSet.comment = data.comment;
  if (data.category !== undefined) updateSet.category = data.category;
  if (data.nickname !== undefined) updateSet.nickname = data.nickname;
  if (data.period !== undefined) updateSet.period = data.period;

  if (Object.keys(updateSet).length === 0) return null;

  await db.update(photos).set(updateSet).where(eq(photos.id, photoId));
  const rows = await db.select().from(photos).where(eq(photos.id, photoId)).limit(1);
  return rows[0] || null;
}

/** Seed sample photos (idempotent — only inserts if table is empty) */
export async function seedSamplePhotos(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select({ count: sql<number>`COUNT(*)` }).from(photos);
  if (existing[0].count > 0) return;

  const samplePhotos: InsertPhoto[] = [
    {
      src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663281517079/Cra9vWXmF9kMxETvDN9C9X/sukima-hero_49e90be8.jpg",
      comment: "いつもの3人、いつもの場所で",
      category: "customers",
      nickname: "スキマ",
      natsukashii: 12,
      isUserPost: 0,
    },
    {
      src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663281517079/Cra9vWXmF9kMxETvDN9C9X/cat-community-QXun2bJvBwptFFh4QErbmM.webp",
      comment: "お茶の時間、いちばん好きな時間",
      category: "customers",
      nickname: "スキマ",
      natsukashii: 8,
      isUserPost: 0,
    },
    {
      src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663281517079/Cra9vWXmF9kMxETvDN9C9X/cat-landscape-DmcgD8ytYga3WK6yMBjCW8.webp",
      comment: "桜が咲いた朝、お店の前で",
      category: "landscape",
      nickname: "スキマ",
      natsukashii: 15,
      isUserPost: 0,
    },
    {
      src: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&q=80",
      comment: "夕暮れの帰り道",
      category: "landscape",
      nickname: "スキマ",
      natsukashii: 6,
      isUserPost: 0,
    },
    {
      src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663281517079/Cra9vWXmF9kMxETvDN9C9X/cat-event-Hs76ghzTAYuERnbNGhfPhV.webp",
      comment: "手づくり市、みんなの笑顔があふれた日",
      category: "events",
      nickname: "スキマ",
      natsukashii: 20,
      isUserPost: 0,
    },
    {
      src: "https://images.unsplash.com/photo-1464618663641-bbdd760ae84a?w=800&q=80",
      comment: "ワークショップの準備中",
      category: "events",
      nickname: "スキマ",
      natsukashii: 9,
      isUserPost: 0,
    },
    {
      src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663281517079/Cra9vWXmF9kMxETvDN9C9X/cat-old-days-VNbS6TBm7D54YycX2utmTD.webp",
      comment: "まだ棚がぜんぜん足りなかった頃",
      category: "old-days",
      nickname: "スキマ",
      natsukashii: 25,
      isUserPost: 0,
    },
    {
      src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
      comment: "オープン前日、ドキドキしてた",
      category: "old-days",
      nickname: "スキマ",
      natsukashii: 18,
      isUserPost: 0,
    },
    {
      src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663281517079/Cra9vWXmF9kMxETvDN9C9X/cat-behind-TTtnrC7kF6KbLhUjM79kmP.webp",
      comment: "新しい作品を並べる、静かな朝",
      category: "behind",
      nickname: "スキマ",
      natsukashii: 11,
      isUserPost: 0,
    },
    {
      src: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
      comment: "閉店後のひとり時間",
      category: "behind",
      nickname: "スキマ",
      natsukashii: 7,
      isUserPost: 0,
    },
    {
      src: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80",
      comment: "買ったマグカップ、毎日使ってます",
      category: "community",
      nickname: "まるこ",
      period: "2024年冬",
      natsukashii: 14,
      isUserPost: 1,
    },
    {
      src: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80",
      comment: "スキマで飲んだコーヒーの味、忘れない",
      category: "community",
      nickname: "ゆうき",
      period: "2024年秋",
      natsukashii: 10,
      isUserPost: 1,
    },
  ];

  await db.insert(photos).values(samplePhotos);
  console.log("[Database] Seeded sample photos");
}
