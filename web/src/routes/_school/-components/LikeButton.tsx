import { HeartFilled } from "@ant-design/icons";
import { Button } from "antd";
import type { ButtonProps } from "antd/lib/index.js";

export type LikeButtonProps = Pick<ButtonProps, "style" | "size" | "disabled" | "className"> & {
  isLike?: boolean;
  children?: number;
  onTrigger?: (isCancel: boolean) => void;
};
export function LikeButton(props: LikeButtonProps) {
  const { onTrigger, isLike, ...reset } = props;
  return (
    <Button
      {...reset}
      type="text"
      icon={<HeartFilled style={{ color: isLike ? "red" : "gray" }} />}
      onClick={() => onTrigger?.(!!isLike)}
    />
  );
}
