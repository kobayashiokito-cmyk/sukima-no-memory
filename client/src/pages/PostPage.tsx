/*
 * PostPage — 写真投稿フォーム
 * Design: 「光のアルバム」ソフト・ノスタルジア
 * 画像圧縮 → S3アップロード → DB保存
 */
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Camera, Upload, ArrowLeft } from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { usePhotos } from "@/hooks/usePhotos";
import { compressImage, getPreviewUrl } from "@/lib/imageCompress";
import Header from "@/components/Header";
import { toast } from "sonner";
import { Link } from "wouter";

export default function PostPage() {
  const [, navigate] = useLocation();
  const { addPhoto } = usePhotos();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [nickname, setNickname] = useState("");
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState("community");
  const [period, setPeriod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("画像ファイルを選択してください");
      return;
    }

    // Show preview immediately
    setPreviewUrl(getPreviewUrl(file));
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("写真を選択してください");
      return;
    }
    if (!comment.trim()) {
      toast.error("一言コメントを入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      // Compress image
      toast.info("写真を圧縮しています...");
      const { base64, mimeType } = await compressImage(selectedFile);

      // Upload via API
      toast.info("投稿しています...");
      await addPhoto({
        imageBase64: base64,
        imageMimeType: mimeType,
        comment: comment.trim(),
        category,
        nickname: nickname.trim() || undefined,
        period: period.trim() || undefined,
      });

      toast.success("投稿しました！", {
        description: "あなたの記憶が追加されました",
      });

      navigate(`/category/${category}`);
    } catch (err) {
      console.error("Post error:", err);
      toast.error("投稿に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const postableCategories = CATEGORIES.filter((c) => c.id !== "community");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8 sm:py-12">
        <motion.div
          className="max-w-lg mx-auto"
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

          <h1 className="font-serif text-2xl sm:text-3xl tracking-wider text-foreground/90 mb-2">
            記憶を投稿する
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            あなたのスキマの思い出を、ここに残してください
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                写真 <span className="text-sage">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {previewUrl ? (
                <div
                  className="relative rounded-xl overflow-hidden cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img
                    src={previewUrl}
                    alt="プレビュー"
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-white text-sm bg-black/40 px-4 py-2 rounded-full">
                      写真を変更
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-sage/30 hover:border-sage/60 bg-sage-light/10 hover:bg-sage-light/20 transition-all duration-300 flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-14 h-14 rounded-full bg-sage-light/40 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-sage-dark" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-sage-dark">写真を選択</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      タップして写真をアップロード
                    </p>
                  </div>
                </button>
              )}
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                ニックネーム
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="名前なしでもOK"
                className="w-full px-4 py-3 rounded-xl bg-card border border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage/50 transition-all duration-300 text-sm"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                一言コメント <span className="text-sage">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="この写真のひとこと"
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-card border border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage/50 transition-all duration-300 text-sm resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                カテゴリ
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory("community")}
                  className={`px-3 py-2.5 rounded-lg text-xs text-center transition-all duration-300 ${
                    category === "community"
                      ? "bg-sage text-white shadow-sm"
                      : "bg-secondary text-muted-foreground hover:bg-sage-light/40"
                  }`}
                >
                  みんなの投稿
                </button>
                {postableCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-2.5 rounded-lg text-xs text-center transition-all duration-300 ${
                      category === cat.id
                        ? "bg-sage text-white shadow-sm"
                        : "bg-secondary text-muted-foreground hover:bg-sage-light/40"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                だいたいの時期 <span className="text-xs text-muted-foreground">（任意）</span>
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="例：2024年の夏"
                className="w-full px-4 py-3 rounded-xl bg-card border border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage/50 transition-all duration-300 text-sm"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-sage text-white rounded-full hover:bg-sage-dark transition-colors duration-400 shadow-md shadow-sage/20 disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  投稿中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  この記憶を投稿する
                </>
              )}
            </button>
          </form>
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
