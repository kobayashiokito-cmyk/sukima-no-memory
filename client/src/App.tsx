/*
 * スキマの記憶 — App ルーティング
 * Design: 「光のアルバム」ソフト・ノスタルジア
 * Color: cream white base, sage green accent, warm gray text
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PhotoProvider } from "./contexts/PhotoContext";
import Home from "./pages/Home";
import CategoryPage from "./pages/CategoryPage";
import PostPage from "./pages/PostPage";
import AdminBulkUpload from "./pages/AdminBulkUpload";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/category/:id" component={CategoryPage} />
      <Route path="/post" component={PostPage} />
      <Route path="/admin/bulk-upload" component={AdminBulkUpload} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <PhotoProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </PhotoProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
