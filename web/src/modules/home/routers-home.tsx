import { LazyRoute } from "@/type.ts";
import { HomePage } from "./page-home.tsx";
import { api } from "@/common/http.ts";
import { HomePageRes } from "@/api.ts";

export const page: LazyRoute = {
  Component: HomePage,
  loader: async (): Promise<HomePageRes | undefined> => {
    return api["/live/screen/home"].get().catch((res) => undefined);
  },
};
