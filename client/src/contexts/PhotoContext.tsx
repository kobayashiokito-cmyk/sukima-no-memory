/*
 * スキマの記憶 — 写真データ共有 Context (API連携版)
 * tRPC経由でバックエンドAPIと通信し、全ユーザーで投稿を共有する
 * 管理者用の編集・削除機能を含む
 */
import { createContext, useContext, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";

// DB Photo type from server
interface Photo {
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

interface PhotoContextValue {
  /** All photos (from current query) */
  photos: Photo[];
  /** Loading state */
  isLoading: boolean;
  /** Add a new photo via API */
  addPhoto: (data: {
    imageBase64: string;
    imageMimeType: string;
    comment: string;
    category: string;
    nickname?: string;
    period?: string;
  }) => Promise<void>;
  /** Increment natsukashii count */
  incrementNatsukashii: (photoId: number) => void;
  /** Get photos by category */
  getPhotosByCategory: (categoryId: string, sort?: "newest" | "natsukashii") => {
    photos: Photo[];
    isLoading: boolean;
  };
  /** Get random photos */
  getRandomPhotos: (count?: number) => { photos: Photo[]; isLoading: boolean; refetch: () => void };
  /** [Admin] Delete a photo */
  deletePhoto: (photoId: number) => Promise<boolean>;
  /** [Admin] Update a photo */
  updatePhoto: (photoId: number, data: {
    comment?: string;
    category?: string;
    nickname?: string;
    period?: string | null;
  }) => Promise<void>;
}

const PhotoContext = createContext<PhotoContextValue | null>(null);

export function PhotoProvider({ children }: { children: ReactNode }) {
  const utils = trpc.useUtils();

  // Create mutation
  const createMutation = trpc.photos.create.useMutation({
    onSuccess: () => {
      utils.photos.list.invalidate();
      utils.photos.random.invalidate();
    },
  });

  // Natsukashii mutation
  const natsukashiiMutation = trpc.photos.natsukashii.useMutation({
    onMutate: async ({ photoId }) => {
      // Optimistic update: increment natsukashii locally
      await utils.photos.list.cancel();
      const previousLists = utils.photos.list.getData();
      
      // Update all cached list queries
      utils.photos.list.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((p) =>
          p.id === photoId ? { ...p, natsukashii: p.natsukashii + 1 } : p
        );
      });

      return { previousLists };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousLists) {
        utils.photos.list.setData(undefined, context.previousLists);
      }
    },
    onSettled: () => {
      utils.photos.list.invalidate();
      utils.photos.random.invalidate();
    },
  });

  // [Admin] Delete mutation
  const deleteMutation = trpc.photos.delete.useMutation({
    onSuccess: () => {
      utils.photos.list.invalidate();
      utils.photos.random.invalidate();
    },
  });

  // [Admin] Update mutation
  const updateMutation = trpc.photos.update.useMutation({
    onSuccess: () => {
      utils.photos.list.invalidate();
      utils.photos.random.invalidate();
    },
  });

  const addPhoto = async (data: {
    imageBase64: string;
    imageMimeType: string;
    comment: string;
    category: string;
    nickname?: string;
    period?: string;
  }) => {
    await createMutation.mutateAsync(data);
  };

  const incrementNatsukashii = (photoId: number) => {
    natsukashiiMutation.mutate({ photoId });
  };

  const getPhotosByCategory = (categoryId: string, sort: "newest" | "natsukashii" = "newest") => {
    const { data, isLoading } = trpc.photos.list.useQuery({ category: categoryId, sort });
    return { photos: data ?? [], isLoading };
  };

  const getRandomPhotos = (count: number = 6) => {
    const { data, isLoading, refetch } = trpc.photos.random.useQuery({ count });
    return { photos: data ?? [], isLoading, refetch };
  };

  const deletePhoto = async (photoId: number): Promise<boolean> => {
    const result = await deleteMutation.mutateAsync({ photoId });
    return result.success;
  };

  const updatePhoto = async (photoId: number, data: {
    comment?: string;
    category?: string;
    nickname?: string;
    period?: string | null;
  }) => {
    await updateMutation.mutateAsync({ photoId, ...data });
  };

  return (
    <PhotoContext.Provider
      value={{
        photos: [],
        isLoading: false,
        addPhoto,
        incrementNatsukashii,
        getPhotosByCategory,
        getRandomPhotos,
        deletePhoto,
        updatePhoto,
      }}
    >
      {children}
    </PhotoContext.Provider>
  );
}

export function usePhotos() {
  const ctx = useContext(PhotoContext);
  if (!ctx) throw new Error("usePhotos must be used within PhotoProvider");
  return ctx;
}
