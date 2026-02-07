import { useLocation, useNavigate } from "@tanstack/react-router";

import { GetPostListParam, GetSelfPostListParam, PublicPost, SelfPost } from "@/api.ts";
import styled from "@emotion/styled";
import { useContext, useEffect, useRef, useState } from "react";
import { EditOutlined } from "@ant-design/icons";
import { useLayoutDirection, LayoutDirection } from "@/provider/mod.tsx";
import { ROUTES } from "@/app.ts";
import wallCoverSrc from "../../-img/wall_cover.webp";
import { CreatePostBtn } from "../../-components/PublishBtn.tsx";
import { ImageFitCover } from "@/lib/components/ImgFitCover.tsx";
import { PostList, PostListHandle, PublishPost, UpdatePostParam } from "@/routes/_school/-components/WallPost.tsx";
import { PostQueryFilterContext } from "./PostQueryFilterContext.tsx";
import { BasicUserContext } from "@/routes/_school/-context/UserContext.tsx";
import { useInfiniteData } from "@/lib/hook/infiniteData.ts";
import { Modal, Spin } from "antd";
import { api } from "@/request/client.ts";
import { dateToString } from "@/common/date.ts";
import { LoaderIndicator, LoadMoreIndicator } from "@/components/LoadMoreIndicator.tsx";

export function PublicPostList(props: PostListProps) {
  const { groupOptions, onOpenComment } = props;
  const filter = useContext(PostQueryFilterContext);
  const isSelf = filter.self;
  const navigate = useNavigate();
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);

  const itemsCtrl = useRef<PostListHandle>(null);
  const [editItem, setEditItem] = useState<(UpdatePostParam & { id: number; updateContent?: boolean }) | undefined>(
    undefined,
  );
  const currentUser = useContext(BasicUserContext);
  const { data, setData, reset, next, previous } = useInfiniteData<PublicPost, string>({
    onPush: (items) => setData((prev) => prev.concat(items)),
    onUnshift: (items) => setData((prev) => items.concat(prev)),
    async load(param, forward) {
      const promise = isSelf
        ? getSelfPostList({ group_id: filter.group?.group_id, cursor: param, forward })
        : getPostList({ group_id: filter.group?.group_id, cursor: param, forward });
      const result = await promise;
      return {
        items: result.items as PublicPost[],
        nextParam: result.cursor_next ? result.cursor_next : undefined,
        prevParam: result.cursor_prev ? result.cursor_prev : undefined,
      };
    },
  });
  const onEditPost = (item: SelfPost, isEdit: boolean) => {
    setEditItem({
      id: item.post_id,
      content_text: item.content_text,
      content_text_structure: item.content_text_structure,
      is_hide: item.config.self_visible,
      comment_disabled: item.config.comment_disabled,
      updateContent: isEdit,
    });
    setModalOpen(true);
  };
  const onOpenPublish = () => {
    if (currentUser) {
      setModalOpen(true);
    } else {
      navigate({ href: ROUTES.Login + `?redirect=${location.pathname}`, viewTransition: true });
    }
  };

  useEffect(() => {
    reset();
    next.loadMore();
  }, [filter.group?.group_id, filter.self]);

  const isVertical = useLayoutDirection() === LayoutDirection.Vertical;
  return (
    <HomePageCSS>
      <div className="post-list">
        <PostListCSS>
          <ImageFitCover src={wallCoverSrc}>
            <div style={{ display: isVertical ? "none" : "block", position: "absolute", right: 20, bottom: 20 }}>
              <CreatePostBtn icon={<EditOutlined />} onClick={onOpenPublish}>
                说点什么
              </CreatePostBtn>
            </div>
          </ImageFitCover>
          {filter.group?.group_desc && <StyledTip>{filter.group.group_desc}</StyledTip>}
          {previous.loading && (
            <LoaderIndicator>
              <Spin size="small" />
            </LoaderIndicator>
          )}
          <PostList
            ref={itemsCtrl}
            data={data}
            setData={setData}
            loadItem={(id) => (isSelf ? getSelfPostItem(id) : getPostItem(id))}
            onEdit={(item) => onEditPost(item as SelfPost, true)}
            onSetting={(item) => onEditPost(item as SelfPost, false)}
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
        </PostListCSS>
      </div>

      <Modal
        title={editItem ? "编辑" : "发布"}
        open={modalOpen}
        maskClosable={false}
        onCancel={() => setModalOpen(false)}
        footer={null}
        afterClose={() => setEditItem(undefined)}
        destroyOnHidden
        width={600}
      >
        <PublishPost
          editType={editItem && editItem.updateContent ? "content" : "config"}
          editId={editItem?.id}
          initValues={editItem ? editItem : { group_id: filter.group?.group_id }}
          onCreateOk={(id) => {
            setModalOpen(false);
            next.loadMore();
            if (isSelf) {
              previous.loadMore();
            } else {
              navigate({ href: "/wall/list/self", viewTransition: true });
            }
          }}
          onEditOk={(id) => {
            itemsCtrl.current?.reloadItem(id);
            setModalOpen(false);
          }}
          groupOptions={groupOptions}
        />
      </Modal>
    </HomePageCSS>
  );
}
async function getPostItem(id: number) {
  const { items } = await getPostList({ post_id: id });
  const item = items[0];
  if (!item) throw new Error("帖子不存在");
  return item;
}
async function getSelfPostItem(id: number) {
  const { items } = await getSelfPostList({ post_id: id });
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

type PostGroupOption = {
  label: string;
  value: number;
};

type PostListProps = {
  groupOptions?: PostGroupOption[];
  onOpenComment?: (postId: number) => void;
};

const StyledTip = styled.div`
  color: #ff9090;
  background-color: #fff;
  font-weight: 500;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 8px;
  font-size: 14px;
`;

const HomePageCSS = styled.div`
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
const PostListCSS = styled.div`
  position: relative;
  max-width: 650px;
  min-width: 300px;
  margin: 0 auto;
`;
