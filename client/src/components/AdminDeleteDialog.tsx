/*
 * AdminDeleteDialog — 管理者用の写真削除確認ダイアログ
 * Design: やわらかい警告、サイトの世界観に合わせたUI
 */
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Photo } from "@/lib/data";

interface AdminDeleteDialogProps {
  photo: Photo | null;
  onClose: () => void;
  onConfirm: (photoId: number) => void;
  isDeleting?: boolean;
}

export default function AdminDeleteDialog({ photo, onClose, onConfirm, isDeleting }: AdminDeleteDialogProps) {
  if (!photo) return null;

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          {/* Dialog */}
          <motion.div
            className="relative z-10 w-full max-w-sm bg-background rounded-2xl shadow-xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif text-lg tracking-wide text-foreground/85">
                  写真を削除
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-all duration-300"
                aria-label="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-4">
              {/* Thumbnail */}
              <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-cream">
                <img
                  src={photo.src}
                  alt={photo.comment}
                  className="w-full h-full object-cover opacity-70"
                />
              </div>

              <p className="text-sm text-foreground/70 leading-relaxed">
                「{photo.comment}」を削除しますか？<br />
                この操作は取り消せません。
              </p>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => onConfirm(photo.id)}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-colors duration-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "削除中..." : "削除する"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
