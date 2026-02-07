import { createLazyFileRoute, NavigateOptions, useNavigate } from "@tanstack/react-router";

import { PostGroupResponse } from "@/api.ts";
import { MenuProps } from "antd";
import { useContext, useEffect, useMemo, useState } from "react";
import { Route as ParentRoute } from "./route.tsx";
import { PostQueryFilterContext } from "./-components/PostQueryFilterContext.tsx";
import { CommentDrawer } from "../../-components/comment.tsx";
import { PublicPostList } from "./-components/PostList.tsx";

export const Route = createLazyFileRoute("/_school/wall/list/{-$groupId}/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { postGroup }: { postGroup: PostGroupResponse | undefined } = ParentRoute.useLoaderData();
  const search = Route.useSearch();
  const filter = useContext(PostQueryFilterContext);
  const isSelf = filter.self;
  const { option, menus } = useMemo(() => {
    const option = postGroup?.items.map((item) => ({
      label: item.group_name,
      value: item.group_id,
      desc: item.rule_desc,
    }));
    const menus: MenuProps["items"] = postGroup?.items.map((item) => ({
      key: item.group_id.toString(),
      label: item.group_name,
    }));

    return { option, menus };
  }, [postGroup]);

  const drawer = useCommentDrawer();

  return (
    <>
      <PublicPostList groupOptions={option} userId={search.userId} onOpenComment={drawer.onOpenComment} />
      <CommentDrawer postId={drawer.commentId} isSelf={isSelf} open={drawer.open} onClose={drawer.closeCommentDrawer} />
    </>
  );
}

function useCommentDrawer() {
  const { openCommentPostId } = Route.useSearch();
  const navigate = useNavigate();

  const onOpenComment = (postId: number) => {
    const options: NavigateOptions = {
      search: (prev: any) => ({ ...prev, openCommentPostId: postId }),
      viewTransition: true,
    };
    navigate(options);
  };

  const [commentId, setCommentId] = useState<number | undefined>();

  useEffect(() => {
    setCommentId(openCommentPostId);
  }, [openCommentPostId]);

  const closeCommentDrawer = () => {
    const options: NavigateOptions = {
      search: ({ openCommentPostId, ...prev }: any) => prev,
      viewTransition: true,
    };
    navigate(options);
  };
  return {
    onOpenComment,
    closeCommentDrawer,
    open: openCommentPostId !== undefined,
    commentId: commentId,
  };
}
