import { useLocation, useNavigate } from "@tanstack/react-router";

import { GetSelfPostListParam, PublicPost, SelfPost } from "@/api.ts";
import { css } from "@emotion/css";
import { useContext, useEffect, useRef, useState } from "react";
import { ROUTES } from "@/app.ts";
import { PostList, PostListHandle } from "@/routes/_school/-components/WallPost.tsx";
import { BasicUserContext } from "@/routes/_school/-context/UserContext.tsx";
import { useInfiniteLoad } from "@/lib/hook/infiniteLoad.ts";
import { Spin } from "antd";
import { api } from "@/request/client.ts";
import { dateToString } from "@/common/date.ts";
import { LoaderIndicator, LoadMoreIndicator } from "@/components/LoadMoreIndicator.tsx";
import { useScrollLoad } from "@/lib/hook/scrollLoad.ts";
type PostListProps = {
  groupId?: number;
  userId?: number;
  onOpenComment?: (postId: number) => void;
};
export function ShelfPostList(props: PostListProps) {
  const { groupId, userId, onOpenComment } = props;

  const navigate = useNavigate();
  const location = useLocation();

  const itemsCtrl = useRef<PostListHandle>(null);

  const currentUser = useContext(BasicUserContext);
  const { data, setData, reset, next, previous } = useInfiniteLoad<SelfPost, string>({
    onPush: (items) => {
      setData((prev) => prev.concat(items));
    },
    onUnshift: (items) => {
      setData((prev) => items.reverse().concat(prev));
    },
    async load(param, forward) {
      const promise = getSelfPostList({ group_id: groupId, cursor: param, forward });
      const result = await promise;
      return {
        items: result.items,
        nextParam: result.cursor_next ? result.cursor_next : undefined,
        prevParam: result.cursor_prev ? result.cursor_prev : undefined,
      };
    },
  });
  const listScroll = useScrollLoad({
    bottomThreshold: 100,
    onScrollBottom: () => next.loadMore(),
  });
  const onEditPost = (item: SelfPost) => {
    //TODO:
  };
  const onSettingPost = (item: SelfPost) => {
    //TODO:
  };
  const onOpenPublish = () => {
    if (currentUser) {
      //TODO
    } else {
      navigate({ href: ROUTES.Login + `?redirect=${location.pathname}`, viewTransition: true });
    }
  };
  const loadItem = async (id: number) => {
    const item = await getSelfPostItem(id);
    setData((prev) => [item, ...prev]);
  };

  useEffect(() => {
    reset();
    next.loadMore();
  }, [groupId, userId]);

  useEffect(() => {
    if (listScroll.isInBottom()) {
      next.loadMore();
    }
  }, [data.length]);

  return (
    <div className={HomePageCSS}>
      <div className="post-list" ref={listScroll.ref}>
        <div className={PostListCSS}>
          {previous.loading && (
            <LoaderIndicator>
              <Spin size="small" />
            </LoaderIndicator>
          )}
          <PostList
            ref={itemsCtrl}
            data={data}
            setData={setData}
            loadItem={getSelfPostItem}
            onEdit={(item) => onEditPost(item)}
            onSetting={(item) => onEditPost(item)}
            onOpenComment={onOpenComment}
            canEdit
          />
          <LoadMoreIndicator
            error={!!next.error}
            hasMore={next.hasMore}
            loading={next.loading}
            isEmpty={data.length === 0}
            onLoad={() => next.loadMore()}
          />
        </div>
      </div>
    </div>
  );
}

async function getSelfPostItem(id: number) {
  const { items } = await getSelfPostList({ post_id: id });
  const item = items[0];
  if (!item) throw new Error("帖子不存在");
  return item;
}
async function getSelfPostList(param?: GetSelfPostListParam) {
  return api["/post/self/list"].get({ query: param }).then((res) => {
    for (const item of res.items) {
      replaceTime(item);
    }
    return res;
  });
}
function replaceTime<T extends { publish_time?: string | null; update_time?: string | null }>(item: T): T {
  if (item.publish_time) {
    item.publish_time = dateToString(item.publish_time, "minute");
  }
  if (item.update_time) {
    item.update_time = dateToString(item.update_time, "minute");
  }
  return item;
}

const HomePageCSS = css`
  height: 100%;
  .post-list {
    box-sizing: border-box;
    padding: 0 12px 4px 12px;
    height: 100%;
    overflow: auto;
  }
  @media screen and (max-width: 400px) {
    .post-list {
      padding: 0 6px 12px 6px;
    }
  }
`;
const PostListCSS = css`
  position: relative;
  max-width: 650px;
  min-width: 300px;
  margin: 0 auto;
`;
