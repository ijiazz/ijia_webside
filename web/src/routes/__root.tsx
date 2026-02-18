import { createRootRoute, Outlet } from "@tanstack/react-router";

import { removeLoading } from "@/app.ts";
import { LayoutDirectionProvider } from "@/provider/LayoutDirectionProvider.tsx";
import { RouterProgress } from "./-layout/Progress.tsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/request/client.ts";
import { PageLoading } from "@/components/page_state.tsx";

export const Route = createRootRoute({
  beforeLoad(ctx) {
    removeLoading();
  },
  component: () => {
    return (
      <QueryClientProvider client={queryClient}>
        <LayoutDirectionProvider>
          <Outlet />
          <RouterProgress />
        </LayoutDirectionProvider>
      </QueryClientProvider>
    );
  },
  pendingComponent: PageLoading,
});
