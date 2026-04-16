/*
 * AdminBulkUpload — 管理者用 複数枚一括アップロードページ
 * Design: 「光のアルバム」ソフト・ノスタルジア
 * ドラッグ&ドロップ + ファイル選択 → プレビュー → 個別/一括設定 → アップロード
 */
import { useState, useRef, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  ArrowLeft,
  ImagePlus,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderUp,
} from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { compressImage, getPreviewUrl } from "@/lib/imageCompress";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface PhotoItem {
  id: string; // local unique id
  file: File;
  previewUrl: string;
  comment: string;
  category: string;
  nickname: string;
  period: string;
  status: "pending" | "compressing" | "uploading" | "done" | "error";
  errorMessage?: string;
}

export default function AdminBulkUpload() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const [items, setItems] = useState<PhotoItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });

  // Bulk settings
  const [bulkCategory, setBulkCategory] = useState("customers");
  const [bulkNickname, setBulkNickname] = useState("");
  const [bulkPeriod, setBulkPeriod] = useState("");

  const bulkCreateMutation = trpc.photos.bulkCreate.useMutation({
    onSuccess: () => {
      utils.photos.list.invalidate();
      utils.photos.random.invalidate();
    },
  });

  const isAdmin = user?.role === "admin";

  // Redirect non-admin
  if (!authLoading && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">このページは管理者のみアクセスできます</p>
          <Link href="/" className="text-sage hover:text-sage-dark mt-4 inline-block underline underline-offset-2">
            トップに戻る
          </Link>
        </div>
      </div>
    );
  }

  const addFiles = useCallback((files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("画像ファイルを選択してください");
      return;
    }
    if (items.length + imageFiles.length > 20) {
      toast.error("一度にアップロードできるのは最大20枚です");
      return;
    }

    const newItems: PhotoItem[] = imageFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: getPreviewUrl(file),
      comment: "",
      category: bulkCategory,
      nickname: bulkNickname,
      period: bulkPeriod,
      status: "pending" as const,
    }));

    setItems((prev) => [...prev, ...newItems]);
    toast.success(`${imageFiles.length}枚の写真を追加しました`);
  }, [items.length, bulkCategory, bulkNickname, bulkPeriod]);

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const updateItem = (id: string, updates: Partial<PhotoItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const applyBulkSettings = () => {
    setItems((prev) =>
      prev.map((item) =>
        item.status === "pending"
          ? {
              ...item,
              category: bulkCategory,
              nickname: bulkNickname,
              period: bulkPeriod,
            }
          : item
      )
    );
    toast.success("一括設定を適用しました");
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      // Reset input so the same files can be selected again
      e.target.value = "";
    }
  };

  const handleUpload = async () => {
    const pendingItems = items.filter((i) => i.status === "pending");
    if (pendingItems.length === 0) {
      toast.error("アップロードする写真がありません");
      return;
    }

    // Validate all items have comments
    const missingComments = pendingItems.filter((i) => !i.comment.trim());
    if (missingComments.length > 0) {
      toast.error(`${missingComments.length}枚の写真にコメントが入力されていません`);
      return;
    }

    setIsUploading(true);
    setUploadProgress({ done: 0, total: pendingItems.length });

    // Compress all images first
    const compressedPhotos: Array<{
      id: string;
      base64: string;
      mimeType: string;
      comment: string;
      category: string;
      nickname: string;
      period: string;
    }> = [];

    for (const item of pendingItems) {
      updateItem(item.id, { status: "compressing" });
      try {
        const { base64, mimeType } = await compressImage(item.file);
        compressedPhotos.push({
          id: item.id,
          base64,
          mimeType,
          comment: item.comment.trim(),
          category: item.category,
          nickname: item.nickname.trim(),
          period: item.period.trim(),
        });
        updateItem(item.id, { status: "uploading" });
      } catch {
        updateItem(item.id, { status: "error", errorMessage: "圧縮に失敗しました" });
      }
    }

    if (compressedPhotos.length === 0) {
      setIsUploading(false);
      toast.error("すべての画像の圧縮に失敗しました");
      return;
    }

    // Upload in batches of 5 to avoid payload size limits
    const batchSize = 5;
    let doneCount = 0;

    for (let i = 0; i < compressedPhotos.length; i += batchSize) {
      const batch = compressedPhotos.slice(i, i + batchSize);
      try {
        const result = await bulkCreateMutation.mutateAsync({
          photos: batch.map((p) => ({
            imageBase64: p.base64,
            imageMimeType: p.mimeType,
            comment: p.comment,
            category: p.category,
            nickname: p.nickname || undefined,
            period: p.period || undefined,
          })),
        });

        // Update individual item statuses
        result.results.forEach((r, idx) => {
          const photo = batch[idx];
          if (r.success) {
            updateItem(photo.id, { status: "done" });
          } else {
            updateItem(photo.id, { status: "error", errorMessage: r.error || "アップロード失敗" });
          }
        });

        doneCount += batch.length;
        setUploadProgress({ done: doneCount, total: compressedPhotos.length });
      } catch {
        // Mark remaining batch items as error
        batch.forEach((p) => {
          updateItem(p.id, { status: "error", errorMessage: "サーバーエラー" });
        });
        doneCount += batch.length;
        setUploadProgress({ done: doneCount, total: compressedPhotos.length });
      }
    }

    setIsUploading(false);

    const successCount = items.filter((i) => i.status === "done").length;
    const errorCount = items.filter((i) => i.status === "error").length;

    if (errorCount === 0) {
      toast.success(`${successCount}枚すべてアップロードしました！`);
    } else {
      toast.warning(`${successCount}枚成功、${errorCount}枚失敗`);
    }
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const doneCount = items.filter((i) => i.status === "done").length;
  const errorCount = items.filter((i) => i.status === "error").length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8 sm:py-12">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            トップに戻る
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <FolderUp className="w-6 h-6 text-sage" />
            <h1 className="font-serif text-2xl sm:text-3xl tracking-wider text-foreground/90">
              一括アップロード
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mb-8">
            管理者専用：複数枚の写真をまとめてアップロードできます（最大20枚）
          </p>

          {/* Bulk Settings */}
          <div className="bg-card rounded-xl border border-border/60 p-5 sm:p-6 mb-6 space-y-4">
            <h2 className="text-sm font-medium text-foreground/80">一括設定</h2>
            <p className="text-xs text-muted-foreground -mt-2">
              ここで設定した内容が、新しく追加する写真のデフォルト値になります
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">カテゴリ</label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/60 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-sage/30"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nickname */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">ニックネーム</label>
                <input
                  type="text"
                  value={bulkNickname}
                  onChange={(e) => setBulkNickname(e.target.value)}
                  placeholder="管理者"
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/60 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-sage/30"
                />
              </div>

              {/* Period */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">時期</label>
                <input
                  type="text"
                  value={bulkPeriod}
                  onChange={(e) => setBulkPeriod(e.target.value)}
                  placeholder="例：2024年の夏"
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/60 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-sage/30"
                />
              </div>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={applyBulkSettings}
                disabled={isUploading}
                className="text-xs text-sage hover:text-sage-dark transition-colors duration-300 underline underline-offset-2 disabled:opacity-50"
              >
                未アップロードの写真にこの設定を一括適用
              </button>
            )}
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-xl border-2 border-dashed transition-all duration-300 mb-6 ${
              isDragging
                ? "border-sage bg-sage-light/20 scale-[1.01]"
                : "border-sage/30 hover:border-sage/60 bg-sage-light/5 hover:bg-sage-light/10"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-12 sm:py-16 flex flex-col items-center justify-center gap-3 disabled:opacity-50"
            >
              <div className="w-16 h-16 rounded-full bg-sage-light/40 flex items-center justify-center">
                <ImagePlus className="w-7 h-7 text-sage-dark" />
              </div>
              <div className="text-center">
                <p className="text-sm text-sage-dark font-medium">
                  写真をドラッグ&ドロップ、またはクリックして選択
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG, WebP対応 / 最大20枚まで
                </p>
              </div>
            </button>
          </div>

          {/* Photo Items List */}
          {items.length > 0 && (
            <>
              {/* Summary Bar */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-foreground/80">{items.length}枚</span>
                  {doneCount > 0 && (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {doneCount}成功
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errorCount}失敗
                    </span>
                  )}
                </div>
                {!isUploading && pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
                      setItems([]);
                    }}
                    className="text-xs text-muted-foreground hover:text-red-500 transition-colors duration-300"
                  >
                    すべてクリア
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {isUploading && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>アップロード中...</span>
                    <span>{uploadProgress.done} / {uploadProgress.total}</span>
                  </div>
                  <div className="h-2 bg-sage-light/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-sage rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: uploadProgress.total > 0
                          ? `${(uploadProgress.done / uploadProgress.total) * 100}%`
                          : "0%",
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Photo Cards */}
              <div className="space-y-4 mb-8">
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className={`bg-card rounded-xl border overflow-hidden ${
                        item.status === "done"
                          ? "border-green-200 bg-green-50/30"
                          : item.status === "error"
                          ? "border-red-200 bg-red-50/30"
                          : "border-border/60"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Thumbnail */}
                        <div className="relative w-full sm:w-40 h-40 sm:h-auto shrink-0">
                          <img
                            src={item.previewUrl}
                            alt={`写真 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Status overlay */}
                          {item.status !== "pending" && (
                            <div
                              className={`absolute inset-0 flex items-center justify-center ${
                                item.status === "done"
                                  ? "bg-green-900/30"
                                  : item.status === "error"
                                  ? "bg-red-900/30"
                                  : "bg-black/30"
                              }`}
                            >
                              {item.status === "compressing" && (
                                <div className="text-white text-xs flex flex-col items-center gap-1">
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  圧縮中
                                </div>
                              )}
                              {item.status === "uploading" && (
                                <div className="text-white text-xs flex flex-col items-center gap-1">
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  アップロード中
                                </div>
                              )}
                              {item.status === "done" && (
                                <CheckCircle2 className="w-8 h-8 text-white" />
                              )}
                              {item.status === "error" && (
                                <div className="text-white text-xs flex flex-col items-center gap-1">
                                  <AlertCircle className="w-6 h-6" />
                                  {item.errorMessage}
                                </div>
                              )}
                            </div>
                          )}
                          {/* Remove button */}
                          {item.status === "pending" && !isUploading && (
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors duration-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Fields */}
                        <div className="flex-1 p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="text-xs text-muted-foreground shrink-0 mt-2 w-8">
                              #{index + 1}
                            </span>
                            <div className="flex-1 space-y-3">
                              {/* Comment */}
                              <div>
                                <input
                                  type="text"
                                  value={item.comment}
                                  onChange={(e) => updateItem(item.id, { comment: e.target.value })}
                                  placeholder="一言コメント *"
                                  disabled={item.status !== "pending" || isUploading}
                                  className="w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-sage/30 disabled:opacity-50"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {/* Category */}
                                <select
                                  value={item.category}
                                  onChange={(e) => updateItem(item.id, { category: e.target.value })}
                                  disabled={item.status !== "pending" || isUploading}
                                  className="px-3 py-2 rounded-lg bg-background border border-border/60 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-sage/30 disabled:opacity-50"
                                >
                                  {CATEGORIES.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </option>
                                  ))}
                                </select>

                                {/* Nickname */}
                                <input
                                  type="text"
                                  value={item.nickname}
                                  onChange={(e) => updateItem(item.id, { nickname: e.target.value })}
                                  placeholder="ニックネーム"
                                  disabled={item.status !== "pending" || isUploading}
                                  className="px-3 py-2 rounded-lg bg-background border border-border/60 text-foreground placeholder:text-muted-foreground/50 text-xs focus:outline-none focus:ring-2 focus:ring-sage/30 disabled:opacity-50"
                                />

                                {/* Period */}
                                <input
                                  type="text"
                                  value={item.period}
                                  onChange={(e) => updateItem(item.id, { period: e.target.value })}
                                  placeholder="時期"
                                  disabled={item.status !== "pending" || isUploading}
                                  className="px-3 py-2 rounded-lg bg-background border border-border/60 text-foreground placeholder:text-muted-foreground/50 text-xs focus:outline-none focus:ring-2 focus:ring-sage/30 disabled:opacity-50"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Upload Button */}
              {pendingCount > 0 && (
                <motion.div
                  className="sticky bottom-6 z-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-sage text-white rounded-2xl hover:bg-sage-dark transition-colors duration-400 shadow-lg shadow-sage/20 disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        アップロード中... ({uploadProgress.done}/{uploadProgress.total})
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        {pendingCount}枚をアップロードする
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              {/* Done state */}
              {pendingCount === 0 && doneCount > 0 && (
                <motion.div
                  className="text-center py-8 space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="text-foreground/80">アップロード完了！</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
                        setItems([]);
                      }}
                      className="px-5 py-2.5 text-sm bg-sage/10 text-sage-dark rounded-full hover:bg-sage/20 transition-colors duration-300"
                    >
                      さらに追加する
                    </button>
                    <Link
                      href={`/category/${bulkCategory}`}
                      className="px-5 py-2.5 text-sm bg-sage text-white rounded-full hover:bg-sage-dark transition-colors duration-300"
                    >
                      アップロードした写真を見る
                    </Link>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-12 text-center border-t border-border/30 mt-8">
        <p className="font-serif text-sm text-muted-foreground tracking-wide">
          スキマの記憶
        </p>
      </footer>
    </div>
  );
}
