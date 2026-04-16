import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getPhotos, getRandomPhotos, createPhoto, incrementNatsukashii, deletePhoto, updatePhoto } from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  photos: router({
    /** Get photos, optionally filtered by category */
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        sort: z.enum(["newest", "natsukashii"]).default("newest"),
      }).optional())
      .query(async ({ input }) => {
        const photos = await getPhotos(input?.category);
        if (input?.sort === "natsukashii") {
          return photos.sort((a, b) => b.natsukashii - a.natsukashii);
        }
        return photos;
      }),

    /** Get random photos */
    random: publicProcedure
      .input(z.object({ count: z.number().min(1).max(20).default(6) }).optional())
      .query(async ({ input }) => {
        return getRandomPhotos(input?.count ?? 6);
      }),

    /** Create a new photo (upload image to S3) */
    create: publicProcedure
      .input(z.object({
        imageBase64: z.string(),
        imageMimeType: z.string().default("image/jpeg"),
        comment: z.string().min(1),
        category: z.string(),
        nickname: z.string().optional(),
        period: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Decode base64 and upload to S3
        const base64Data = input.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const ext = input.imageMimeType.split("/")[1] || "jpeg";
        const fileKey = `photos/${nanoid()}.${ext}`;

        const { url } = await storagePut(fileKey, buffer, input.imageMimeType);

        // Create photo record in DB
        const photo = await createPhoto({
          src: url,
          comment: input.comment,
          category: input.category,
          nickname: input.nickname || "名前なし",
          period: input.period || null,
          natsukashii: 0,
          isUserPost: 1,
        });

        return photo;
      }),

    /** [Admin] Bulk upload photos */
    bulkCreate: adminProcedure
      .input(z.object({
        photos: z.array(z.object({
          imageBase64: z.string(),
          imageMimeType: z.string().default("image/jpeg"),
          comment: z.string().min(1),
          category: z.string(),
          nickname: z.string().optional(),
          period: z.string().optional(),
        })).min(1).max(20),
      }))
      .mutation(async ({ input }) => {
        const results: Array<{ id: number; src: string; comment: string; success: boolean; error?: string }> = [];

        for (const item of input.photos) {
          try {
            const base64Data = item.imageBase64.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, "base64");
            const ext = item.imageMimeType.split("/")[1] || "jpeg";
            const fileKey = `photos/${nanoid()}.${ext}`;

            const { url } = await storagePut(fileKey, buffer, item.imageMimeType);

            const photo = await createPhoto({
              src: url,
              comment: item.comment,
              category: item.category,
              nickname: item.nickname || "管理者",
              period: item.period || null,
              natsukashii: 0,
              isUserPost: 0,
            });

            results.push({ id: photo.id, src: photo.src, comment: photo.comment, success: true });
          } catch (err) {
            results.push({
              id: 0,
              src: "",
              comment: item.comment,
              success: false,
              error: err instanceof Error ? err.message : "Unknown error",
            });
          }
        }

        return {
          total: input.photos.length,
          succeeded: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          results,
        };
      }),

    /** Increment natsukashii count */
    natsukashii: publicProcedure
      .input(z.object({ photoId: z.number() }))
      .mutation(async ({ input }) => {
        const photo = await incrementNatsukashii(input.photoId);
        return photo;
      }),

    /** [Admin] Delete a photo */
    delete: adminProcedure
      .input(z.object({ photoId: z.number() }))
      .mutation(async ({ input }) => {
        const success = await deletePhoto(input.photoId);
        return { success };
      }),

    /** [Admin] Update a photo's editable fields */
    update: adminProcedure
      .input(z.object({
        photoId: z.number(),
        comment: z.string().min(1).optional(),
        category: z.string().optional(),
        nickname: z.string().optional(),
        period: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { photoId, ...data } = input;
        const photo = await updatePhoto(photoId, data);
        return photo;
      }),
  }),
});

export type AppRouter = typeof appRouter;
