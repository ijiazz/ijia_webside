import { Platform } from "@ijia/data/db";
import { GodPlatformDto } from "./live.dto.ts";

export const list: GodPlatformDto[] = [
  {
    platform: Platform.bilibili,
    user_name: "佳佳佳-zZ",
    stat: { followers_count: 120000 },
    user_id: "18429568",
    home_url: "https://space.bilibili.com/18429568",
    avatar_url: "/main/avatar/bilibili.webp",
  },
  {
    platform: Platform.xiaoHongShu,
    user_name: "佳佳子_zZ",
    stat: { followers_count: 15000 },
    user_id: "",
    home_url: "https://www.xiaohongshu.com/user/profile/58e8b3b66a6a696804f89bb3",
    avatar_url: "/main/avatar/xiaohongshu.webp",
  },
  {
    platform: Platform.v5sing,
    user_name: "佳佳佳_zZ",
    stat: { followers_count: 3441 },
    user_id: "",
    home_url: "https://5sing.kugou.com/62584043/default.html",
    avatar_url: "/main/avatar/5sing.jpg",
  },
  {
    platform: Platform.wangYiMusic,
    user_name: "佳佳佳_zZ",
    stat: { followers_count: 11833 },
    user_id: "372467686",
    home_url: "https://music.163.com/#/user/home?id=372467686",
    avatar_url: "/main/avatar/wangyi.jpg",
  },
];
