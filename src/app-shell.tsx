import { Outlet } from "react-router";

import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

function RoutedLayout() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      storageKey="vite-ui-theme"
    >
      <div className="grid min-h-svh grid-rows-[auto_1fr]">
        <Header />
        <Outlet />
      </div>
      <Toaster richColors />
    </ThemeProvider>
  );
}

export default function AppShell() {
  return <RoutedLayout />;
}
