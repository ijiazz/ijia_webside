import { AssetItemDto } from "@/api.ts";
import { Platform } from "@/common/third_part_account.tsx";

// Mock data for AssetItemDto array
export const mockAssetItemDtoArray: AssetItemDto[] = [
  {
    platform: Platform.douYin,
    asset_id: "1",
    author: {
      user_id: "user1",

      user_name: "Author1",
      ip_location: "上海",
      avatar_url: "https://example.com/avatar1.png",
    },
    type: 1,
    content_text: "This is a sample content text.",
    cover: {
      thumb: { url: "https://example.com/thumbnail1.png", width: 150, height: 150 },
      origin: { url: "https://example.com/original1.png", width: 1024, height: 768 },
    },
    publish_time: new Date("2023-01-01T10:00:00Z"),
    ip_location: "New York, USA",
  },
  {
    platform: Platform.weibo,
    asset_id: "2",
    author: {
      user_id: "user2",
      user_name: "Author2",
      avatar_url: "https://example.com/avatar2.png",
      ip_location: null,
    },
    type: 2,
    content_text: null,
    cover: {
      thumb: { url: "https://example.com/thumbnail2.png", width: 150, height: 150 },
      origin: { url: "https://example.com/thumbnail2.png", width: 150, height: 150 },
    },
    publish_time: new Date("2023-02-01T10:00:00Z"),
    ip_location: "Los Angeles, USA",
  },
  {
    platform: Platform.weibo,
    asset_id: "3",
    author: {
      user_id: "user2",
      user_name: "Author2",
      avatar_url: "https://example.com/avatar2.png",
      ip_location: null,
    },
    type: 2,
    content_text: null,
    cover: {
      thumb: { url: "https://example.com/thumbnail2.png", width: 150, height: 150 },
      origin: { url: "https://example.com/thumbnail2.png", width: 150, height: 150 },
    },
    publish_time: new Date("2023-02-01T10:00:00Z"),
    ip_location: "Los Angeles, USA",
  },
  {
    platform: Platform.weibo,
    asset_id: "4",
    author: {
      user_id: "user2",
      user_name: "Author2",
      avatar_url: "https://example.com/avatar2.png",
      ip_location: null,
    },
    type: 2,
    content_text: null,
    cover: {
      thumb: { url: "https://example.com/thumbnail2.png", width: 150, height: 150 },
      origin: { url: "https://example.com/thumbnail2.png", width: 150, height: 150 },
    },
    publish_time: new Date("2023-02-01T10:00:00Z"),
    ip_location: "Los Angeles, USA",
  },
  {
    platform: Platform.weibo,
    asset_id: "5",
    author: {
      user_id: "user2",
      user_name: "Author2",
      avatar_url: "https://example.com/avatar2.png",
      ip_location: null,
    },
    type: 2,
    content_text: null,
    cover: {
      thumb: { url: "https://example.com/thumbnail2.png", width: 150, height: 150 },
      origin: { url: "https://example.com/thumbnail2.png", width: 150, height: 150 },
    },
    publish_time: new Date("2023-02-01T10:00:00Z"),
    ip_location: "Los Angeles, USA",
  },
  {
    platform: Platform.weibo,
    asset_id: "6",
    author: {
      user_id: "user2",
      user_name: "Author2",
      avatar_url: "https://example.com/avatar2.png",
      ip_location: null,
    },
    type: 2,
    content_text: null,
    cover: {
      thumb: { url: "https://example.com/thumbnail2.png", width: 150, height: 150 },
      origin: { url: "https://example.com/thumbnail2.png", width: 150, height: 150 },
    },
    publish_time: new Date("2023-02-01T10:00:00Z"),
    ip_location: "Los Angeles, USA",
  },
];
