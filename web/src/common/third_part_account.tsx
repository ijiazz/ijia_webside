import { Select, SelectProps, Space } from "antd";
import { TikTokOutlined, BilibiliOutlined, WeiboOutlined } from "@ant-design/icons";
import { ReactNode } from "react";
import React from "react";
import douyinIco from "./third_part_platforms/douyin.png";
import v5singIco from "./third_part_platforms/5sing.png";
import wangyimusicIco from "./third_part_platforms/wangyimusic.png";
import bilibiliIco from "./third_part_platforms/bilibili.png";
import weiboIco from "./third_part_platforms/weibo.png";
import xiaohongshuIco from "./third_part_platforms/xiaohongshu.png";
import { Platform } from "@/api.ts";

export type ThirdPartSelectProps<T extends Platform | Platform[] = Platform | Platform[]> = Omit<
  SelectProps<T>,
  "mode" | "value" | "onChange"
> & {
  value?: T;
  onChange?(value: T): void;
};

export function ThirdPartSelect(props: ThirdPartSelectProps<Platform> & { mode?: undefined }): ReactNode;
export function ThirdPartSelect(props: ThirdPartSelectProps<Platform[]> & { mode: "multiple" }): ReactNode;
export function ThirdPartSelect(props: ThirdPartSelectProps & { mode?: "multiple" }) {
  return <Select {...props} options={THIRD_PART_OPTION} />;
}
export const THIRD_PART: Record<Platform, { iconOutline?: ReactNode; icon?: ReactNode; name: string }> = {
  [Platform.douYin]: {
    iconOutline: <TikTokOutlined />,
    icon: <Icon src={douyinIco} />,
    name: "抖音",
  },
  [Platform.weibo]: {
    iconOutline: <WeiboOutlined />,
    icon: <Icon src={weiboIco} />,
    name: "微博",
  },
  [Platform.bilibili]: {
    iconOutline: <BilibiliOutlined />,
    icon: <Icon src={bilibiliIco} />,
    name: "Bilibili",
  },
  [Platform.v5sing]: {
    name: "5Sing音乐",
    icon: <Icon src={v5singIco} />,
  },
  [Platform.wangYiMusic]: {
    name: "网易云音乐",
    icon: <Icon src={wangyimusicIco} />,
  },
  [Platform.xiaoHongShu]: {
    name: "小红书",
    icon: <Icon src={xiaohongshuIco} />,
  },
};
const THIRD_PART_OPTION = Object.entries(THIRD_PART).map(([key, info]) => ({
  label: (
    <Space>
      {info.iconOutline}
      {info.name}
    </Space>
  ),
  value: key,
}));
function Icon(props: { src: string }) {
  return <img src={props.src} style={{ width: "1em", height: "1em", objectFit: "cover" }} />;
}
