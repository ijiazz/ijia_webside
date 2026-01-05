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
import qqmusicIco from "./third_part_platforms/qqmusic.png";
import hongguoIco from "./third_part_platforms/hongguo.png";
import { Platform, SocialPlatform } from "@/api.ts";

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
export const THIRD_PART: Record<SocialPlatform, { iconOutline?: ReactNode; icon?: ReactNode; name: string }> = {
  [SocialPlatform.douYin]: {
    iconOutline: <TikTokOutlined />,
    icon: <Icon src={douyinIco} />,
    name: "抖音",
  },
  [SocialPlatform.weibo]: {
    iconOutline: <WeiboOutlined />,
    icon: <Icon src={weiboIco} />,
    name: "微博",
  },
  [SocialPlatform.bilibili]: {
    iconOutline: <BilibiliOutlined />,
    icon: <Icon src={bilibiliIco} />,
    name: "bilibili",
  },
  [SocialPlatform.v5sing]: {
    name: "5sing 音乐",
    icon: <Icon src={v5singIco} />,
  },
  [SocialPlatform.wangYiMusic]: {
    name: "网易云音乐",
    icon: <Icon src={wangyimusicIco} />,
  },
  [SocialPlatform.xiaoHongShu]: {
    name: "小红书",
    icon: <Icon src={xiaohongshuIco} />,
  },
  [SocialPlatform.qqMusic]: {
    name: "QQ 音乐",
    icon: <Icon src={qqmusicIco} />,
  },
  [SocialPlatform.hongGuo]: {
    name: "红果短剧",
    icon: <Icon src={hongguoIco} style={{ borderRadius: "20%" }} />,
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
function Icon(props: { src: string; style?: React.CSSProperties }) {
  return <img src={props.src} style={{ width: "1em", height: "1em", objectFit: "cover", ...props.style }} />;
}
