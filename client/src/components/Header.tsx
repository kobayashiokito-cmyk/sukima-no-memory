/*
 * Header — サイト共通ヘッダー
 * Design: minimal, serif title, sage accent
 * Admin: 管理者にのみ一括アップロードリンクを表示
 */
import { Link, useLocation } from "wouter";
import { Camera, Home, Send, FolderUp } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Header() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isHome = location === "/";
  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container flex items-center justify-between h-14 sm:h-16">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Camera className="w-5 h-5 text-sage transition-colors duration-300 group-hover:text-sage-dark" />
          <span className="font-serif text-base sm:text-lg tracking-wider text-foreground/85 group-hover:text-foreground transition-colors duration-300">
            スキマの記憶
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {!isHome && (
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 rounded-lg hover:bg-sage-light/30"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">トップ</span>
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/bulk-upload"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 rounded-lg hover:bg-sage-light/30"
            >
              <FolderUp className="w-4 h-4" />
              <span className="hidden sm:inline">一括UP</span>
            </Link>
          )}
          <Link
            href="/post"
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-sage/90 text-white rounded-full hover:bg-sage-dark transition-colors duration-400 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>投稿する</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
