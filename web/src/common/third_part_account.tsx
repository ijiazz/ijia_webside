import { Select, Space } from "antd";
import { TikTokOutlined, BilibiliOutlined, WeiboOutlined } from "@ant-design/icons";
import { ReactNode } from "react";

export type ThirdPartSelectProps<T extends Platform | Platform[] = Platform | Platform[]> = {
  value: T;
  onChange(value: T): void;
};

export function ThirdPartSelect(props: ThirdPartSelectProps<Platform> & { mode?: undefined }): ReactNode;
export function ThirdPartSelect(props: ThirdPartSelectProps<Platform[]> & { mode: "multiple" }): ReactNode;
export function ThirdPartSelect(props: ThirdPartSelectProps & { mode?: "multiple" }) {
  const { onChange, value, mode } = props;
  return <Select mode={mode} value={value} onChange={onChange} options={THIRD_PART_OPTION} />;
}
export const THIRD_PART: Record<Platform, { iconOutline?: ReactNode; name: string }> = {
  [Platform.douYin]: {
    iconOutline: <TikTokOutlined />,
    name: "抖音",
  },
  [Platform.weibo]: {
    iconOutline: <WeiboOutlined />,
    name: "微博",
  },
  [Platform.bilibili]: {
    iconOutline: <BilibiliOutlined />,
    name: "Bilibili",
  },
  [Platform.v5sing]: {
    name: "5Sing音乐",
  },
  [Platform.wangYiMusic]: {
    name: "网易云音乐",
  },
  [Platform.xiaoHongShu]: {
    name: "小红书",
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

export declare enum Platform {
  /** 抖音 */
  douYin = "douyin",
  /** bilibili */
  bilibili = "bilibili",
  /** 小红书 */
  xiaoHongShu = "xiaohonshu",
  /** 微博 */
  weibo = "weibo",
  /** 5Sing 音乐 */
  v5sing = "v5sing",
  /** 网易云音乐 */
  wangYiMusic = "wangyiyun",
}
