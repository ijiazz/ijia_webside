import { useLocation, useNavigate } from "@tanstack/react-router";

import { GetPostListParam, PublicPost } from "@/api.ts";
import { css } from "@emotion/css";
import { useContext, useEffect, useRef } from "react";
import { EditOutlined } from "@ant-design/icons";
import { useLayoutDirection, LayoutDirection, useThemeToken } from "@/provider/mod.tsx";
import { ROUTES } from "@/app.ts";
import wallCoverSrc from "../../-img/wall_cover.webp";
import { CreatePostBtn } from "../../-components/PublishBtn.tsx";
import { ImageFitCover } from "@/lib/components/ImgFitCover.tsx";
import { PostList, PostListHandle } from "@/routes/_school/-components/WallPost.tsx";
import { PostQueryFilterContext } from "./PostQueryFilterContext.tsx";
import { BasicUserContext } from "@/routes/_school/-context/UserContext.tsx";
import { useInfiniteLoad } from "@/lib/hook/infiniteLoad.ts";
import { Spin } from "antd";
import { api } from "@/request/client.ts";
import { dateToString } from "@/common/date.ts";
import { LoaderIndicator, LoadMoreIndicator } from "@/components/LoadMoreIndicator.tsx";
import { useScrollLoad } from "@/lib/hook/scrollLoad.ts";
type PostListProps = {
  userId?: number;
  onOpenComment?: (postId: number) => void;
};
export function PublicPostList(props: PostListProps) {
  const { userId, onOpenComment } = props;
  const filter = useContext(PostQueryFilterContext);
  const group = filter.group;
  const isSelf = filter.self;
  const navigate = useNavigate();
  const location = useLocation();

  const itemsCtrl = useRef<PostListHandle>(null);

  const currentUser = useContext(BasicUserContext);
  const { data, setData, reset, next, previous } = useInfiniteLoad<PublicPost, string>({
    async load(param, forward) {
      const result = await getPostList({ group_id: group?.group_id, cursor: param, forward, userId: userId });
      return {
        items: forward ? result.items.reverse() : result.items,
        nextParam: result.cursor_next ? result.cursor_next : undefined,
        prevParam: result.cursor_prev ? result.cursor_prev : undefined,
      };
    },
  });
  const listScroll = useScrollLoad({
    bottomThreshold: 100,
    onScrollBottom: () => next.loadMore(),
  });

  const onOpenPublish = () => {
    if (currentUser) {
      navigate({ to: "/wall/publish", viewTransition: true });
    } else {
      navigate({ href: ROUTES.Login + `?redirect=${location.pathname}`, viewTransition: true });
    }
  };

  useEffect(() => {
    reset();
    next.loadMore();
  }, [group?.group_id, isSelf, userId]);

  useEffect(() => {
    if (listScroll.isInBottom()) {
      next.loadMore();
    }
  }, [data.length]);

  const isVertical = useLayoutDirection() === LayoutDirection.Vertical;
  const theme = useThemeToken();
  return (
    <div style={{ height: "100%" }}>
      <div className={HomePageCSS} ref={listScroll.ref}>
        <div className={PostListCSS}>
          <ImageFitCover src={wallCoverSrc}>
            <div style={{ display: isVertical ? "none" : "block", position: "absolute", right: 20, bottom: 20 }}>
              <CreatePostBtn
                icon={<EditOutlined />}
                style={{ "--color1": theme.colorPrimaryHover, "--color2": theme.colorPrimary }}
                onClick={onOpenPublish}
              >
                说点什么
              </CreatePostBtn>
            </div>
          </ImageFitCover>
          {group?.group_desc && <div className={StyledTip}>{group.group_desc}</div>}
          {previous.loading && (
            <LoaderIndicator>
              <Spin size="small" />
            </LoaderIndicator>
          )}
          <PostList
            ref={itemsCtrl}
            data={data}
            setData={setData}
            loadItem={getPostItem}
            onOpenComment={onOpenComment}
            canEdit={isSelf}
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
async function getPostItem(id: number) {
  const { items } = await getPostList({ post_id: id });
  const item = items[0];
  if (!item) throw new Error("帖子不存在");
  return item;
}

async function getPostList(param?: GetPostListParam) {
  return api["/post/list"].get({ query: param }).then((res) => {
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

type PostGroupOption = {
  label: string;
  value: number;
};

const StyledTip = css`
  color: #ff9090;
  background-color: #fff;
  font-weight: 500;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 8px;
  font-size: 14px;
`;

const HomePageCSS = css`
  box-sizing: border-box;
  padding: 0 12px 4px 12px;
  height: 100%;
  overflow: auto;
  @media screen and (max-width: 400px) {
    padding: 0 6px 12px 6px;
  }
`;
const PostListCSS = css`
  position: relative;
  max-width: 650px;
  min-width: 300px;
  margin: 0 auto;
`;
