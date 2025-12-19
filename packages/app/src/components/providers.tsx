import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AuthProvider } from "../contexts/auth-context";
import { CompaniesProvider } from "../contexts/companies-context";
import { NotificationsProvider } from "../contexts/notifications-context";
import { PageLoadingProvider } from "../contexts/page-loading-context";
import { RequestsProvider } from "../contexts/requests-context";
import { SLASettingsProvider } from "../contexts/sla-settings-context";
import { SupportChatProvider } from "../contexts/support-chat-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minuto
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <PageLoadingProvider>
        <AuthProvider>
          <SLASettingsProvider>
            <SupportChatProvider>
              <CompaniesProvider>
                <RequestsProvider>
                  <NotificationsProvider>{children}</NotificationsProvider>
                </RequestsProvider>
              </CompaniesProvider>
            </SupportChatProvider>
          </SLASettingsProvider>
        </AuthProvider>
      </PageLoadingProvider>
    </QueryClientProvider>
  );
}
