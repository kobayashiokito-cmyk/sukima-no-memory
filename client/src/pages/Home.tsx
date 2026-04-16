/*
 * Home — トップページ
 * Design: 「光のアルバム」ソフト・ノスタルジア
 * Hero with copy → Category cards → Random photos
 * Admin: 管理者にのみランダム写真セクションで編集・削除ボタンを表示
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Send, Shuffle } from "lucide-react";
import { CATEGORIES, Photo } from "@/lib/data";
import { usePhotos } from "@/hooks/usePhotos";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import PhotoGrid from "@/components/PhotoGrid";
import AdminEditModal from "@/components/AdminEditModal";
import AdminDeleteDialog from "@/components/AdminDeleteDialog";
import { toast } from "sonner";

export default function Home() {
  const { getRandomPhotos, incrementNatsukashii, deletePhoto, updatePhoto } = usePhotos();
  const { user } = useAuth();
  const { photos: randomPhotos, isLoading, refetch } = getRandomPhotos(6);

  // Admin state
  const isAdmin = user?.role === "admin";
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<Photo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container py-16 sm:py-24 lg:py-32">
          <motion.div
            className="max-w-2xl mx-auto text-center space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-wider text-foreground/90 leading-tight">
              スキマの記憶
            </h1>
            <p className="font-serif text-base sm:text-lg text-sage-dark/80 tracking-wide">
              なんでもない日が、一番残る
            </p>
            <div className="w-12 h-px bg-sage/40 mx-auto" />
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
              スキマ雑貨で重なってきた日々を、<br className="sm:hidden" />
              写真でたどれる小さな写真館です
            </p>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-8 left-8 w-32 h-32 bg-sage-light/20 rounded-full blur-3xl" />
        <div className="absolute bottom-8 right-12 w-40 h-40 bg-peach-light/30 rounded-full blur-3xl" />
      </section>

      {/* Category Cards */}
      <section className="container pb-16 sm:pb-24">
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {CATEGORIES.map((cat) => (
            <motion.div
              key={cat.id}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
                },
              }}
            >
              <Link
                href={`/category/${cat.id}`}
                className="group block overflow-hidden rounded-xl bg-card shadow-sm shadow-black/4 hover:shadow-lg hover:shadow-black/8 transition-all duration-500"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 sm:p-5 space-y-1.5">
                  <h3 className="font-serif text-base sm:text-lg tracking-wide text-foreground/85 group-hover:text-sage-dark transition-colors duration-400">
                    {cat.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Post CTA */}
        <motion.div
          className="mt-12 sm:mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link
            href="/post"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-sage text-white rounded-full hover:bg-sage-dark transition-colors duration-400 shadow-md shadow-sage/20 hover:shadow-lg hover:shadow-sage/30 text-sm sm:text-base"
          >
            <Send className="w-4 h-4" />
            あなたの記憶も、のこしませんか
          </Link>
        </motion.div>
      </section>

      {/* Random Photos Section */}
      <section className="bg-secondary/30 py-16 sm:py-24">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl tracking-wide text-foreground/85">
                ふと思い出す写真
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                ランダムに選ばれた記憶たち
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-sage-dark hover:text-sage bg-sage-light/40 hover:bg-sage-light/70 rounded-full transition-all duration-300"
            >
              <Shuffle className="w-4 h-4" />
              <span className="hidden sm:inline">シャッフル</span>
            </button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-lg bg-sage-light/20 animate-pulse" />
              ))}
            </div>
          ) : (
            <PhotoGrid
              photos={randomPhotos}
              onNatsukashii={incrementNatsukashii}
              isAdmin={isAdmin}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 sm:py-16 text-center">
        <div className="container space-y-4">
          <p className="font-serif text-sm text-muted-foreground tracking-wide">
            スキマの記憶
          </p>
          <p className="text-xs text-muted-foreground/60">
            <a
              href="https://sukimasec-hxvfv5dx.manus.space/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sage-dark transition-colors duration-300 underline underline-offset-2"
            >
              スキマ雑貨のサイトへ
            </a>
          </p>
        </div>
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
