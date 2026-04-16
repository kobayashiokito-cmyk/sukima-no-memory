/*
 * PhotoGrid — 写真グリッド表示
 * Design: stagger animation, soft shadows, hover scale
 * Admin: 管理者にのみ編集・削除ボタンを表示
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { Photo } from "@/lib/data";
import PhotoModal from "./PhotoModal";

interface PhotoGridProps {
  photos: Photo[];
  onNatsukashii: (id: number) => void;
  showNickname?: boolean;
  /** 管理者モード: 編集・削除ボタンを表示 */
  isAdmin?: boolean;
  onEdit?: (photo: Photo) => void;
  onDelete?: (photo: Photo) => void;
}

export default function PhotoGrid({
  photos,
  onNatsukashii,
  showNickname = false,
  isAdmin = false,
  onEdit,
  onDelete,
}: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0, 0, 0.2, 1] as const },
    },
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {photos.map((photo) => (
          <motion.div
            key={photo.id}
            variants={itemVariants}
            className="group cursor-pointer"
            onClick={() => setSelectedPhoto(photo)}
          >
            <div className="relative overflow-hidden rounded-lg bg-cream shadow-sm shadow-black/5 hover:shadow-md hover:shadow-black/8 transition-shadow duration-400">
              {/* Admin buttons overlay */}
              {isAdmin && (
                <div className="absolute top-2 right-2 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(photo);
                    }}
                    className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-sage-light transition-colors duration-300"
                    aria-label="編集"
                    title="編集"
                  >
                    <Pencil className="w-3.5 h-3.5 text-sage-dark" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(photo);
                    }}
                    className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-50 transition-colors duration-300"
                    aria-label="削除"
                    title="削除"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500/80" />
                  </button>
                </div>
              )}

              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={photo.src}
                  alt={photo.comment}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                  loading="lazy"
                />
              </div>
              <div className="p-3 space-y-1.5">
                <p className="text-xs sm:text-sm text-foreground/75 line-clamp-2 leading-relaxed">
                  {photo.comment}
                </p>
                <div className="flex items-center justify-between">
                  {showNickname && photo.nickname ? (
                    <span className="text-xs text-muted-foreground">{photo.nickname}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{formatDate(photo.createdAt)}</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNatsukashii(photo.id);
                    }}
                    className="flex items-center gap-1 text-xs text-sage-dark/70 hover:text-sage-dark transition-colors duration-300"
                  >
                    <span>🍃</span>
                    <span>{photo.natsukashii}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <PhotoModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onNatsukashii={(id) => {
          onNatsukashii(id);
          setSelectedPhoto((prev) =>
            prev ? { ...prev, natsukashii: prev.natsukashii + 1 } : null
          );
        }}
        isAdmin={isAdmin}
        onEdit={(photo) => {
          setSelectedPhoto(null);
          onEdit?.(photo);
        }}
        onDelete={(photo) => {
          setSelectedPhoto(null);
          onDelete?.(photo);
        }}
      />
    </>
  );
}
