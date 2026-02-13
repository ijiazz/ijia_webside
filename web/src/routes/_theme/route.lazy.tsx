import { createLazyFileRoute } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { HoFetchProvider, AntdThemeProvider } from "@/provider/mod.tsx";
import { GlobalAlert } from "@/components/page_state/Alert.tsx";

export const Route = createLazyFileRoute("/_theme")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AntdThemeProvider fixedMode="light">
      <HoFetchProvider>
        <GlobalAlert> 
          <Outlet />
        </GlobalAlert>
      </HoFetchProvider>
    </AntdThemeProvider>
  );
}
