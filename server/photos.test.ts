import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions
vi.mock("./db", () => ({
  getPhotos: vi.fn(),
  getRandomPhotos: vi.fn(),
  createPhoto: vi.fn(),
  incrementNatsukashii: vi.fn(),
  deletePhoto: vi.fn(),
  updatePhoto: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  seedSamplePhotos: vi.fn(),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn(),
}));

import { getPhotos, getRandomPhotos, createPhoto, incrementNatsukashii, deletePhoto, updatePhoto } from "./db";
import { storagePut } from "./storage";

const mockGetPhotos = vi.mocked(getPhotos);
const mockGetRandomPhotos = vi.mocked(getRandomPhotos);
const mockCreatePhoto = vi.mocked(createPhoto);
const mockIncrementNatsukashii = vi.mocked(incrementNatsukashii);
const mockDeletePhoto = vi.mocked(deletePhoto);
const mockUpdatePhoto = vi.mocked(updatePhoto);
const mockStoragePut = vi.mocked(storagePut);

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "normal-user",
      email: "user@example.com",
      name: "User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

const samplePhotos = [
  {
    id: 1,
    src: "https://example.com/photo1.jpg",
    comment: "テスト写真1",
    category: "customers",
    nickname: "テスト",
    period: null,
    natsukashii: 5,
    isUserPost: 0,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: 2,
    src: "https://example.com/photo2.jpg",
    comment: "テスト写真2",
    category: "landscape",
    nickname: "テスト2",
    period: "2024年春",
    natsukashii: 10,
    isUserPost: 1,
    createdAt: new Date("2024-03-20"),
  },
];

describe("photos.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all photos sorted by newest", async () => {
    mockGetPhotos.mockResolvedValue(samplePhotos);
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.photos.list({ sort: "newest" });

    expect(mockGetPhotos).toHaveBeenCalledWith(undefined);
    expect(result).toHaveLength(2);
    expect(result[0].comment).toBe("テスト写真1");
  });

  it("returns photos filtered by category", async () => {
    mockGetPhotos.mockResolvedValue([samplePhotos[0]]);
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.photos.list({ category: "customers", sort: "newest" });

    expect(mockGetPhotos).toHaveBeenCalledWith("customers");
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("customers");
  });

  it("returns photos sorted by natsukashii", async () => {
    mockGetPhotos.mockResolvedValue(samplePhotos);
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.photos.list({ sort: "natsukashii" });

    expect(result[0].natsukashii).toBe(10);
    expect(result[1].natsukashii).toBe(5);
  });
});

describe("photos.random", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns random photos with default count", async () => {
    mockGetRandomPhotos.mockResolvedValue(samplePhotos);
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.photos.random();

    expect(mockGetRandomPhotos).toHaveBeenCalledWith(6);
    expect(result).toHaveLength(2);
  });

  it("returns random photos with custom count", async () => {
    mockGetRandomPhotos.mockResolvedValue([samplePhotos[0]]);
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.photos.random({ count: 3 });

    expect(mockGetRandomPhotos).toHaveBeenCalledWith(3);
    expect(result).toHaveLength(1);
  });
});

describe("photos.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("compresses, uploads to S3, and creates photo record", async () => {
    const fakeBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
    mockStoragePut.mockResolvedValue({ url: "https://s3.example.com/photos/abc.jpeg", key: "photos/abc.jpeg" });
    mockCreatePhoto.mockResolvedValue({
      id: 3,
      src: "https://s3.example.com/photos/abc.jpeg",
      comment: "新しい写真",
      category: "community",
      nickname: "投稿者",
      period: "2024年冬",
      natsukashii: 0,
      isUserPost: 1,
      createdAt: new Date(),
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.photos.create({
      imageBase64: fakeBase64,
      imageMimeType: "image/jpeg",
      comment: "新しい写真",
      category: "community",
      nickname: "投稿者",
      period: "2024年冬",
    });

    expect(mockStoragePut).toHaveBeenCalledTimes(1);
    expect(mockCreatePhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        src: "https://s3.example.com/photos/abc.jpeg",
        comment: "新しい写真",
        category: "community",
        nickname: "投稿者",
        isUserPost: 1,
      })
    );
    expect(result.id).toBe(3);
    expect(result.src).toBe("https://s3.example.com/photos/abc.jpeg");
  });
});

describe("photos.natsukashii", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("increments natsukashii count for a photo", async () => {
    const updatedPhoto = { ...samplePhotos[0], natsukashii: 6 };
    mockIncrementNatsukashii.mockResolvedValue(updatedPhoto);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.photos.natsukashii({ photoId: 1 });

    expect(mockIncrementNatsukashii).toHaveBeenCalledWith(1);
    expect(result?.natsukashii).toBe(6);
  });
});

describe("photos.delete (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin to delete a photo", async () => {
    mockDeletePhoto.mockResolvedValue(true);
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.photos.delete({ photoId: 1 });

    expect(mockDeletePhoto).toHaveBeenCalledWith(1);
    expect(result.success).toBe(true);
  });

  it("returns false when photo does not exist", async () => {
    mockDeletePhoto.mockResolvedValue(false);
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.photos.delete({ photoId: 999 });

    expect(mockDeletePhoto).toHaveBeenCalledWith(999);
    expect(result.success).toBe(false);
  });

  it("rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.photos.delete({ photoId: 1 })).rejects.toThrow();
    expect(mockDeletePhoto).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.photos.delete({ photoId: 1 })).rejects.toThrow();
    expect(mockDeletePhoto).not.toHaveBeenCalled();
  });
});

describe("photos.update (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin to update photo comment", async () => {
    const updatedPhoto = { ...samplePhotos[0], comment: "更新されたコメント" };
    mockUpdatePhoto.mockResolvedValue(updatedPhoto);
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.photos.update({ photoId: 1, comment: "更新されたコメント" });

    expect(mockUpdatePhoto).toHaveBeenCalledWith(1, { comment: "更新されたコメント" });
    expect(result?.comment).toBe("更新されたコメント");
  });

  it("allows admin to update multiple fields", async () => {
    const updatedPhoto = {
      ...samplePhotos[0],
      comment: "新コメント",
      category: "events",
      nickname: "新ニックネーム",
      period: "2025年春",
    };
    mockUpdatePhoto.mockResolvedValue(updatedPhoto);
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.photos.update({
      photoId: 1,
      comment: "新コメント",
      category: "events",
      nickname: "新ニックネーム",
      period: "2025年春",
    });

    expect(mockUpdatePhoto).toHaveBeenCalledWith(1, {
      comment: "新コメント",
      category: "events",
      nickname: "新ニックネーム",
      period: "2025年春",
    });
    expect(result?.category).toBe("events");
    expect(result?.nickname).toBe("新ニックネーム");
  });

  it("allows admin to clear period field", async () => {
    const updatedPhoto = { ...samplePhotos[1], period: null };
    mockUpdatePhoto.mockResolvedValue(updatedPhoto);
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.photos.update({ photoId: 2, period: null });

    expect(mockUpdatePhoto).toHaveBeenCalledWith(2, { period: null });
    expect(result?.period).toBeNull();
  });

  it("rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.photos.update({ photoId: 1, comment: "不正な更新" })
    ).rejects.toThrow();
    expect(mockUpdatePhoto).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.photos.update({ photoId: 1, comment: "不正な更新" })
    ).rejects.toThrow();
    expect(mockUpdatePhoto).not.toHaveBeenCalled();
  });
});

describe("photos.bulkCreate (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin to bulk upload multiple photos", async () => {
    const fakeBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
    mockStoragePut.mockResolvedValue({ url: "https://s3.example.com/photos/bulk.jpeg", key: "photos/bulk.jpeg" });
    mockCreatePhoto.mockImplementation(async (data) => ({
      id: Math.floor(Math.random() * 1000),
      src: data.src,
      comment: data.comment,
      category: data.category,
      nickname: data.nickname || "管理者",
      period: data.period || null,
      natsukashii: 0,
      isUserPost: 0,
      createdAt: new Date(),
    }));

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.photos.bulkCreate({
      photos: [
        {
          imageBase64: fakeBase64,
          imageMimeType: "image/jpeg",
          comment: "一括写真1",
          category: "customers",
          nickname: "管理者",
          period: "2024年夏",
        },
        {
          imageBase64: fakeBase64,
          imageMimeType: "image/jpeg",
          comment: "一括写真2",
          category: "events",
        },
        {
          imageBase64: fakeBase64,
          imageMimeType: "image/jpeg",
          comment: "一括写真3",
          category: "landscape",
          period: "2024年秋",
        },
      ],
    });

    expect(result.total).toBe(3);
    expect(result.succeeded).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.results).toHaveLength(3);
    expect(result.results.every((r) => r.success)).toBe(true);
    expect(mockStoragePut).toHaveBeenCalledTimes(3);
    expect(mockCreatePhoto).toHaveBeenCalledTimes(3);

    // Verify isUserPost is 0 for admin bulk uploads
    expect(mockCreatePhoto).toHaveBeenCalledWith(
      expect.objectContaining({ isUserPost: 0 })
    );
  });

  it("handles partial failures gracefully", async () => {
    const fakeBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
    
    // First call succeeds, second fails
    mockStoragePut
      .mockResolvedValueOnce({ url: "https://s3.example.com/photos/ok.jpeg", key: "photos/ok.jpeg" })
      .mockRejectedValueOnce(new Error("S3 upload failed"));

    mockCreatePhoto.mockResolvedValue({
      id: 10,
      src: "https://s3.example.com/photos/ok.jpeg",
      comment: "成功した写真",
      category: "customers",
      nickname: "管理者",
      period: null,
      natsukashii: 0,
      isUserPost: 0,
      createdAt: new Date(),
    });

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.photos.bulkCreate({
      photos: [
        {
          imageBase64: fakeBase64,
          imageMimeType: "image/jpeg",
          comment: "成功した写真",
          category: "customers",
        },
        {
          imageBase64: fakeBase64,
          imageMimeType: "image/jpeg",
          comment: "失敗した写真",
          category: "events",
        },
      ],
    });

    expect(result.total).toBe(2);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.results[0].success).toBe(true);
    expect(result.results[1].success).toBe(false);
    expect(result.results[1].error).toBe("S3 upload failed");
  });

  it("rejects non-admin users", async () => {
    const fakeBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.photos.bulkCreate({
        photos: [
          {
            imageBase64: fakeBase64,
            imageMimeType: "image/jpeg",
            comment: "不正な一括アップロード",
            category: "customers",
          },
        ],
      })
    ).rejects.toThrow();
    expect(mockStoragePut).not.toHaveBeenCalled();
    expect(mockCreatePhoto).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated users", async () => {
    const fakeBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.photos.bulkCreate({
        photos: [
          {
            imageBase64: fakeBase64,
            imageMimeType: "image/jpeg",
            comment: "不正な一括アップロード",
            category: "customers",
          },
        ],
      })
    ).rejects.toThrow();
    expect(mockStoragePut).not.toHaveBeenCalled();
    expect(mockCreatePhoto).not.toHaveBeenCalled();
  });
});
