import { createRootRoute, Outlet } from "@tanstack/react-router";

import { removeLoading } from "@/app.ts";
import { LayoutDirectionProvider } from "@/provider/LayoutDirectionProvider.tsx";
import { RouterProgress } from "./-layout/Progress.tsx";
import { QueryClientProvider, FetchQueryOptions } from "@tanstack/react-query";
import { queryClient, apiEvent, VersionUpdateEvent } from "@/request/client.ts";
import { PageLoading } from "@/components/page_state.tsx";
import { BUILD_TIME } from "@/common/env.ts";
import { ijiaSessionStorage } from "@/stores/session_store.ts";

export const Route = createRootRoute({
  beforeLoad(ctx) {
    removeLoading();
    checkVersion().then(
      (newVersion) => {
        if (!newVersion) return;
        const lastReloadTime = ijiaSessionStorage.lastReloadTime;
        if (lastReloadTime && Date.now() - lastReloadTime < 5 * 60 * 1000) {
          // 5分钟内已经重载过了，避免重复重载
          return;
        }

        ijiaSessionStorage.lastReloadTime = Date.now();
        console.info("检测到新版本，正在重载页面...");
        window.location.reload();
      },
      () => {},
    );
  },
  loader(ctx) {
    checkVersion().then(
      (newVersion) => {
        if (!newVersion) return;
        VersionUpdateEvent.version = newVersion;
        apiEvent.dispatchEvent(new VersionUpdateEvent(newVersion));
      },
      () => {},
    );
  },
  staleTime: 60 * 60 * 1000, // 1小时检查一次版本
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

type VersionResponse = {
  nextVersion: string;
};
async function checkVersion() {
  const VERSION_QUERY_OPTION = {
    queryKey: ["app", "version"],
    queryFn: (): Promise<VersionResponse> => fetch("/version.json").then((res) => res.json()),
    staleTime: 10 * 60 * 1000, // 10分钟
  } satisfies FetchQueryOptions;

  const result = await queryClient.fetchQuery(VERSION_QUERY_OPTION);

  const newest = new Date(result.nextVersion).getTime();

  return BUILD_TIME.getTime() < newest ? result.nextVersion : null;
}
