/*
 * CategoryPage — カテゴリ別写真一覧
 * Design: 「光のアルバム」ソフト・ノスタルジア
 * Sort: 新着順 / なつかしい順
 * Admin: 管理者にのみ編集・削除ボタンを表示
 */
import { useState } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Heart } from "lucide-react";
import { CATEGORIES, Photo } from "@/lib/data";
import { usePhotos } from "@/hooks/usePhotos";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import PhotoGrid from "@/components/PhotoGrid";
import AdminEditModal from "@/components/AdminEditModal";
import AdminDeleteDialog from "@/components/AdminDeleteDialog";
import { toast } from "sonner";

type SortMode = "newest" | "natsukashii";

export default function CategoryPage() {
  const params = useParams<{ id: string }>();
  const categoryId = params.id;
  const category = CATEGORIES.find((c) => c.id === categoryId);
  const { getPhotosByCategory, incrementNatsukashii, deletePhoto, updatePhoto } = usePhotos();
  const { user } = useAuth();
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  // Admin state
  const isAdmin = user?.role === "admin";
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<Photo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { photos, isLoading } = getPhotosByCategory(categoryId || "", sortMode);

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-24 text-center">
          <p className="text-muted-foreground">カテゴリが見つかりません</p>
          <Link href="/" className="text-sage-dark underline underline-offset-2 mt-4 inline-block">
            トップに戻る
          </Link>
        </div>
      </div>
    );
  }

  const isCommunity = categoryId === "community";

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo);
  };

  const handleDelete = (photo: Photo) => {
    setDeletingPhoto(photo);
  };

  const handleSaveEdit = async (photoId: number, data: {
    comment?: string;
    category?: string;
    nickname?: string;
    period?: string | null;
  }) => {
    setIsSaving(true);
    try {
      await updatePhoto(photoId, data);
      toast.success("更新しました", { description: "写真の情報を更新しました" });
      setEditingPhoto(null);
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async (photoId: number) => {
    setIsDeleting(true);
    try {
      await deletePhoto(photoId);
      toast.success("削除しました", { description: "写真を削除しました" });
      setDeletingPhoto(null);
    } catch {
      toast.error("削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Category Hero */}
      <section className="relative overflow-hidden">
        <div className="aspect-[3/1] sm:aspect-[4/1] overflow-hidden">
          <img
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <div className="container pb-6 sm:pb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition-colors duration-300 mb-3"
              >
                <ArrowLeft className="w-4 h-4" />
                トップに戻る
              </Link>
              <h1 className="font-serif text-2xl sm:text-3xl tracking-wider text-foreground/90">
                {category.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {category.description}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Sort & Content */}
      <section className="container py-8 sm:py-12">
        {/* Sort buttons */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-xs text-muted-foreground mr-1">並び替え</span>
          <button
            onClick={() => setSortMode("newest")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-full transition-all duration-300 ${
              sortMode === "newest"
                ? "bg-sage text-white shadow-sm"
                : "bg-secondary text-muted-foreground hover:bg-sage-light/50"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            新着順
          </button>
          <button
            onClick={() => setSortMode("natsukashii")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-full transition-all duration-300 ${
              sortMode === "natsukashii"
                ? "bg-sage text-white shadow-sm"
                : "bg-secondary text-muted-foreground hover:bg-sage-light/50"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            なつかしい順
          </button>

          {isAdmin && (
            <span className="ml-auto text-xs text-sage-dark bg-sage-light/40 px-3 py-1 rounded-full">
              管理者モード
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-lg bg-sage-light/20 animate-pulse" />
            ))}
          </div>
        ) : photos.length > 0 ? (
          <PhotoGrid
            photos={photos}
            onNatsukashii={incrementNatsukashii}
            showNickname={isCommunity}
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <div className="py-24 text-center">
            <p className="text-muted-foreground text-sm">
              まだ写真がありません
            </p>
            {isCommunity && (
              <Link
                href="/post"
                className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-sage text-white rounded-full text-sm hover:bg-sage-dark transition-colors duration-300"
              >
                最初の投稿をする
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="py-12 text-center border-t border-border/30">
        <p className="font-serif text-sm text-muted-foreground tracking-wide">
          スキマの記憶
        </p>
      </footer>

      {/* Admin Modals */}
      <AdminEditModal
        photo={editingPhoto}
        onClose={() => setEditingPhoto(null)}
        onSave={handleSaveEdit}
        isSaving={isSaving}
      />
      <AdminDeleteDialog
        photo={deletingPhoto}
        onClose={() => setDeletingPhoto(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
