import { CommentList, CommentListProps } from "./comment/CommentList.tsx";
import { Drawer } from "antd";
import { LayoutDirection, useLayoutDirection } from "@/provider/mod.tsx";
import { Suspense } from "react";
import { ErrorBoundary, PageSpin } from "@/components/page_state.tsx";

export type CommentDrawerProps = Omit<CommentListProps, "commentTreeId"> & {
  open?: boolean;
  onClose?: () => void;
  commentTreeId?: string;
};
export function CommentDrawer(props: CommentDrawerProps) {
  const { onClose, open, ...rest } = props;

  const isHorizontal = useLayoutDirection() === LayoutDirection.Horizontal;
  return (
    <Drawer
      open={open}
      onClose={onClose}
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
    >
      <ErrorBoundary>
        <Suspense fallback={<PageSpin />}>
          <CommentList commentTreeId={rest.commentTreeId} {...rest} />
        </Suspense>
      </ErrorBoundary>
    </Drawer>
  );
}
