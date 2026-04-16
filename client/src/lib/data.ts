/*
 * スキマの記憶 — データ定義
 * Design: 「光のアルバム」ソフト・ノスタルジア
 */

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
}

/** Photo type matching the DB schema */
export interface Photo {
  id: number;
  src: string;
  comment: string;
  category: string;
  nickname: string | null;
  period: string | null;
  natsukashii: number;
  isUserPost: number;
  createdAt: Date;
}

export const CATEGORIES: Category[] = [
  {
    id: "customers",
    name: "お客さん",
    description: "スキマに来てくれた、大切なひとたち",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663281517079/Cra9vWXmF9kMxETvDN9C9X/sukima-hero_49e90be8.jpg",
  },
  {
    id: "landscape",
    name: "スキマ近くの風景",
    description: "窓から見える景色、通り道の空",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663281517079/Cra9vWXmF9kMxETvDN9C9X/cat-landscape-DmcgD8ytYga3WK6yMBjCW8.webp",
  },
  {
    id: "events",
    name: "イベント",
    description: "みんなで作った、特別な日のこと",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663281517079/Cra9vWXmF9kMxETvDN9C9X/cat-event-Hs76ghzTAYuERnbNGhfPhV.webp",
  },
  {
    id: "old-days",
    name: "あの頃",
    description: "振り返ると、ぜんぶが愛おしい",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663281517079/Cra9vWXmF9kMxETvDN9C9X/cat-old-days-VNbS6TBm7D54YycX2utmTD.webp",
  },
  {
    id: "behind",
    name: "スキマの裏側",
    description: "お店の向こう側、ちいさな日常",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663281517079/Cra9vWXmF9kMxETvDN9C9X/cat-behind-TTtnrC7kF6KbLhUjM79kmP.webp",
  },
  {
    id: "community",
    name: "みんなの投稿",
    description: "あなたの記憶も、ここに",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663281517079/Cra9vWXmF9kMxETvDN9C9X/cat-community-QXun2bJvBwptFFh4QErbmM.webp",
  },
];
