import { LazyRoute } from "@/type.ts";
import { HomePage } from "./page-home.tsx";
import { api } from "@/common/http.ts";
import { HomePageRes } from "@/api.ts";

export const page: LazyRoute = {
  Component: HomePage,
  loader: async (): Promise<HomePageRes> => {
    return api["/live/screen/home"].get().catch(
      (res): HomePageRes => ({
        god_user: { user_name: "" },
        god_user_platforms: [],
        current_user: { encountering_time: "", user_id: "", user_name: "" },
      }),
    );
  },
};
