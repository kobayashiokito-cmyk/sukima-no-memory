/*
 * AdminEditModal — 管理者用の写真編集モーダル
 * Design: やわらかいフォーム、サイトの世界観に合わせたUI
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save } from "lucide-react";
import { Photo, CATEGORIES } from "@/lib/data";

interface AdminEditModalProps {
  photo: Photo | null;
  onClose: () => void;
  onSave: (photoId: number, data: {
    comment?: string;
    category?: string;
    nickname?: string;
    period?: string | null;
  }) => void;
  isSaving?: boolean;
}

export default function AdminEditModal({ photo, onClose, onSave, isSaving }: AdminEditModalProps) {
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState("");
  const [nickname, setNickname] = useState("");
  const [period, setPeriod] = useState("");

  useEffect(() => {
    if (photo) {
      setComment(photo.comment);
      setCategory(photo.category);
      setNickname(photo.nickname || "");
      setPeriod(photo.period || "");
    }
  }, [photo]);

  if (!photo) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(photo.id, {
      comment: comment.trim() || undefined,
      category: category || undefined,
      nickname: nickname.trim() || undefined,
      period: period.trim() || null,
    });
  };

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

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-lg bg-background rounded-2xl shadow-xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <h3 className="font-serif text-lg tracking-wide text-foreground/85">
                写真を編集
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-all duration-300"
                aria-label="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thumbnail */}
            <div className="px-6 pt-4">
              <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-cream">
                <img
                  src={photo.src}
                  alt={photo.comment}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Comment */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/70">
                  一言コメント
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-secondary/50 border border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage/50 transition-all duration-300 resize-none"
                  rows={2}
                  placeholder="この写真のひとこと"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/70">
                  カテゴリ
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`px-3 py-1.5 text-xs rounded-full transition-all duration-300 ${
                        category === cat.id
                          ? "bg-sage text-white shadow-sm"
                          : "bg-secondary text-muted-foreground hover:bg-sage-light/50"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nickname */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/70">
                  ニックネーム
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-secondary/50 border border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage/50 transition-all duration-300"
                  placeholder="名前なし"
                />
              </div>

              {/* Period */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/70">
                  だいたいの時期
                </label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-secondary/50 border border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage/50 transition-all duration-300"
                  placeholder="例：2024年の夏"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !comment.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm bg-sage text-white rounded-full hover:bg-sage-dark transition-colors duration-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "保存中..." : "保存する"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
