import { Drawer, DrawerProps } from "antd";
import type { ErrorBoundaryProps } from "@/components/page_state.tsx";
import { LayoutDirection, useLayoutDirection } from "@/provider/mod.tsx";
import { Suspense } from "react";
import { ErrorBoundary, PageSpin } from "@/components/page_state.tsx";
export * from "./comment/CommentList.tsx";

export type CommentDrawerProps = Omit<DrawerProps, "title" | "size" | "placement"> & {
  getResetKey?: ErrorBoundaryProps["getResetKey"];
};
export function CommentDrawer(props: CommentDrawerProps) {
  const { children, getResetKey, ...rest } = props;
  const isHorizontal = useLayoutDirection() === LayoutDirection.Horizontal;
  return (
    <Drawer
      title="评论"
      size={isHorizontal ? 450 : "60%"}
      placement={isHorizontal ? "right" : "bottom"}
      styles={{
        body: {
          padding: 14,
        },
        header: {
          padding: 8,
        },
      }}
      {...rest}
    >
      <ErrorBoundary getResetKey={getResetKey}>
        <Suspense fallback={<PageSpin />}>{children}</Suspense>
      </ErrorBoundary>
    </Drawer>
  );
}
