import { HeartFilled } from "@ant-design/icons";
import { Button } from "antd";
import React from "react";

export type LikeButtonProps = {
  disabled?: boolean;
  isLike?: boolean;
  children?: number;
  onTrigger?: (isCancel: boolean) => void;
};
export function LikeButton(props: LikeButtonProps) {
  return (
    <Button
      disabled={props.disabled}
      type="text"
      size="small"
      icon={<HeartFilled style={{ color: props.isLike ? "red" : "gray" }} />}
      onClick={() => props.onTrigger?.(!!props.isLike)}
    >
      {props.children}
    </Button>
  );
}
