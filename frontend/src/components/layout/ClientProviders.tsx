"use client";

import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { I18nProvider } from "@/lib/i18n";
import ToastContainer from "@/components/ui/Toast";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            {children}
            <ToastContainer />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
