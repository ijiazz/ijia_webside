import { HomePageDto } from "./type.ts";
import { Platform } from "@/common/third_part_account.tsx";
import { LazyRoute } from "@/type.ts";
import { HomePage } from "./index.tsx";

export const page: LazyRoute = {
  Component: HomePage,
  loader: async (): Promise<HomePageDto> => {
    return {
      current_user: null,
      god_user: {
        user_name: "ABC",
        avatar_url: null,
      },
      god_user_platforms: [
        {
          platform: Platform.douYin,
          stat: {
            followers_count: 123456,
            post_digg_total: 123456,
            post_total: 123456,
          },
          user_id: "123456",
          user_name: "ABC_zZ",
          avatar_url: null,
          cover_url: null,
        },
      ],
    };
  },
};
