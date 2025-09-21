import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";

import { PostGroupResponse } from "@/api.ts";
import { MenuProps } from "antd";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { Route as ParentRoute } from "./route.tsx";
import { PostQueryFilterContext } from "./-components/PostQueryFilterContext.tsx";
import { CommentDrawer } from "../../-components/comment.tsx";
import { PostList } from "./-components/PostList.tsx";

export const Route = createLazyFileRoute("/_school/wall/list/{-$groupId}")({
  component: RouteComponent,
});

function RouteComponent() {
  const data: PostGroupResponse | undefined = ParentRoute.useLoaderData();
  const filter = useContext(PostQueryFilterContext);
  const isSelf = filter.self;
  const { option, menus } = useMemo(() => {
    const option = data?.items.map((item) => ({
      label: item.group_name,
      value: item.group_id,
      desc: item.rule_desc,
    }));
    const menus: MenuProps["items"] = data?.items.map((item) => ({
      key: item.group_id.toString(),
      label: item.group_name,
    }));

    return { option, menus };
  }, [data]);

  const drawer = useCommentDrawer();

  return (
    <>
      <PostList groupOptions={option} onOpenComment={drawer.onOpenComment} />
      <CommentDrawer postId={drawer.commentId} isSelf={isSelf} open={drawer.open} onClose={drawer.closeCommentDrawer} />
    </>
  );
}

const OPEN_COMMENT_POST_ID_KEY = "openCommentPostId";

function useCommentDrawer() {
  const search = Route.useSearch({});
  const navigate = useNavigate();

  const onOpenComment = (postId: number) => {
    navigate({ search: (prev) => ({ ...prev, [OPEN_COMMENT_POST_ID_KEY]: postId }) });
  };

  const [commentId, setCommentId] = useState<number | undefined>();

  const searchCommentIdStr = search[OPEN_COMMENT_POST_ID_KEY];
  useEffect(() => {
    if (searchCommentIdStr) {
      const searchCommentId = +searchCommentIdStr;
      if (Number.isInteger(searchCommentId)) setCommentId(searchCommentId);
    }
  }, [searchCommentIdStr]);

  const closeCommentDrawer = () => {
    navigate({
      search: ({ [OPEN_COMMENT_POST_ID_KEY]: k, ...prev }) => prev,
    });
  };
  return {
    onOpenComment,
    closeCommentDrawer,
    open: searchCommentIdStr,
    commentId: commentId,
  };
}
