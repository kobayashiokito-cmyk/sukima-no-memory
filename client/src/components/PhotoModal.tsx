/*
 * PhotoModal — 写真拡大表示モーダル
 * Design: ミルキーホワイトのオーバーレイ、写真が浮かぶ
 * Admin: 管理者にのみ編集・削除ボタンを表示
 */
import { motion, AnimatePresence } from "framer-motion";
import { X, Pencil, Trash2 } from "lucide-react";
import { Photo } from "@/lib/data";

interface PhotoModalProps {
  photo: Photo | null;
  onClose: () => void;
  onNatsukashii?: (id: number) => void;
  /** 管理者モード */
  isAdmin?: boolean;
  onEdit?: (photo: Photo) => void;
  onDelete?: (photo: Photo) => void;
}

export default function PhotoModal({ photo, onClose, onNatsukashii, isAdmin, onEdit, onDelete }: PhotoModalProps) {
  if (!photo) return null;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          onClick={onClose}
        >
          {/* Milky white overlay */}
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm" />

          {/* Content */}
          <motion.div
            className="relative z-10 max-w-3xl w-full"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top buttons */}
            <div className="absolute -top-12 right-0 flex items-center gap-2">
              {isAdmin && (
                <>
                  <button
                    onClick={() => onEdit?.(photo)}
                    className="p-2 text-sage-dark hover:text-sage bg-white/80 backdrop-blur-sm rounded-full shadow-sm transition-colors duration-300"
                    aria-label="編集"
                    title="編集"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete?.(photo)}
                    className="p-2 text-red-500/70 hover:text-red-600 bg-white/80 backdrop-blur-sm rounded-full shadow-sm transition-colors duration-300"
                    aria-label="削除"
                    title="削除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 text-warm-gray hover:text-foreground transition-colors duration-300"
                aria-label="閉じる"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Photo */}
            <div className="rounded-xl overflow-hidden shadow-lg shadow-black/5">
              <img
                src={photo.src}
                alt={photo.comment}
                className="w-full h-auto max-h-[70vh] object-contain bg-cream"
                loading="lazy"
              />
            </div>

            {/* Caption area */}
            <div className="mt-6 text-center space-y-3">
              <p className="font-serif text-lg text-foreground/80 leading-relaxed">
                {photo.comment}
              </p>
              {photo.nickname && (
                <p className="text-sm text-muted-foreground">
                  — {photo.nickname}
                  {photo.period && <span className="ml-2">({photo.period})</span>}
                </p>
              )}
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => onNatsukashii?.(photo.id)}
                  className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-sage-light/60 hover:bg-sage-light text-sage-dark transition-all duration-400 text-sm"
                >
                  <span className="text-base group-hover:scale-110 transition-transform duration-300">🍃</span>
                  <span>なつかしい</span>
                  <span className="text-sage-dark/70 font-medium">{photo.natsukashii}</span>
                </button>
                <span className="text-xs text-muted-foreground">{formatDate(photo.createdAt)}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
