import { CommentList, CommentListProps } from "./comment/CommentList.tsx";
import { Drawer, Spin } from "antd";
import { LayoutDirection, useLayoutDirection } from "@/provider/mod.tsx";
import { Suspense } from "react";
import { CatchBoundary } from "@tanstack/react-router";
import { ErrorPage } from "@/components/page_state.tsx";
import * as sentry from "@sentry/react";

export type CommentDrawerProps = Omit<CommentListProps, "commentTreeId"> & {
  open?: boolean;
  onClose?: () => void;
  commentTreeId?: string;
};
export function CommentDrawer(props: CommentDrawerProps) {
  const { onClose, open, commentTreeId, ...rest } = props;

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
      <CatchBoundary
        getResetKey={() => commentTreeId ?? ""}
        onCatch={(error) => sentry.captureException(error)}
        errorComponent={({ error, reset, info }) => (
          <ErrorPage error={error} reset={reset} info={info?.componentStack} />
        )}
      >
        <Suspense fallback={<Spin />}>
          {commentTreeId && <CommentList commentTreeId={commentTreeId} {...rest} />}
        </Suspense>
      </CatchBoundary>
    </Drawer>
  );
}
