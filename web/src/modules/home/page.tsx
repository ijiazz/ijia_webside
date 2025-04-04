import { LazyRoute } from "@/type.ts";
import { HomePage } from "./index.tsx";
import { api } from "@/common/http.ts";
import { HomePageRes } from "@/api.ts";

export const page: LazyRoute = {
  Component: HomePage,
  loader: async (): Promise<HomePageRes> => {
    return api["/live/screen/home"].get();
  },
};
