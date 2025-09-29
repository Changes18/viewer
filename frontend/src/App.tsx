import { useState } from "react";
import { SWRConfig } from "swr";
import { Toaster } from "react-hot-toast";
import { DndContext } from "@dnd-kit/core";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/ThemeProvider";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import { fetcher } from "./lib/api";

function AppContent() {
  // Всегда показываем Dashboard, игнорируем авторизацию
  return <Dashboard />;
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <DndContext>
        <SWRConfig
          value={{
            fetcher,
            refreshInterval: 5000, // Обновление каждые 5 секунд
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
          }}
        >
          <AuthProvider>
            <AppContent />
            <Toaster position="top-right" />
          </AuthProvider>
        </SWRConfig>
      </DndContext>
    </ThemeProvider>
  );
}

export default App;
