import { GetUserPostListParam, Post, PostUserResponse } from "@/api.ts";
import { css, cx } from "@emotion/css";
import { useEffect, useRef, useState } from "react";
import { PostList, PostListHandle, PublishPost, UpdatePostParam } from "@/routes/_school/-components/WallPost.tsx";
import { useInfiniteLoad } from "@/lib/hook/infiniteLoad.ts";
import { Modal, Spin } from "antd";
import { dateToString } from "@/common/date.ts";
import { LoaderIndicator, LoadMoreIndicator } from "@/components/LoadMoreIndicator.tsx";
import { useScrollLoad } from "@/lib/hook/scrollLoad.ts";
import { useNavigate } from "@tanstack/react-router";
import { CreatePostBtn } from "@/routes/_school/wall/-components/PublishBtn.tsx";
import { EditOutlined } from "@ant-design/icons";
import { useThemeToken } from "@/provider/AntdProvider.tsx";

import { api } from "@/request/client.ts";
type PostListProps = {
  groupId?: number;
  userId: number;
  canEdit?: boolean;
  hideReport?: boolean;
  onOpenComment?: (postId: number) => void;
};
export function UserPostList(props: PostListProps) {
  const { groupId, userId, canEdit, hideReport, onOpenComment } = props;
  const navigate = useNavigate();
  const itemsCtrl = useRef<PostListHandle>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<(UpdatePostParam & { id: number; updateContent?: boolean }) | undefined>(
    undefined,
  );

  const { data, setData, reset, next, previous } = useInfiniteLoad<Post, string>({
    async load(param, forward) {
      const promise = getUserPostList({ group_id: groupId, cursor: param, forward, userId });
      const result = await promise;

      for (const item of result.items) {
        replaceTime(item);
      }

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
  const onEditPost = (item: Post, isEdit: boolean) => {
    if (!item.config) return;
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
  const onSettingPost = (item: Post) => {
    onEditPost(item, false);
  };
  const loadItem = async (id: number) => {
    const item = await getUserPostItem(id);
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
  const theme = useThemeToken();
  return (
    <div style={{ height: "100%" }}>
      <div className={cx(HomePageCSS, PostListCSS)} ref={listScroll.ref}>
        {canEdit && (
          <div style={{ marginBottom: 14, display: "flex", justifyContent: "end" }}>
            <CreatePostBtn
              style={{ "--color1": theme.colorPrimaryHover, "--color2": theme.colorPrimary }}
              icon={<EditOutlined />}
              onClick={() => navigate({ to: "/wall/publish" })}
            >
              说点什么
            </CreatePostBtn>
          </div>
        )}
        {previous.loading && (
          <LoaderIndicator>
            <Spin size="small" />
          </LoaderIndicator>
        )}
        <PostList
          ref={itemsCtrl}
          data={data}
          setData={setData}
          loadItem={getUserPostItem}
          onEdit={(item) => onEditPost(item, true)}
          onSetting={(item) => onSettingPost(item)}
          onOpenComment={onOpenComment}
          canEdit={canEdit}
          hideReport={hideReport}
        />
        <LoadMoreIndicator
          error={!!next.error}
          hasMore={next.hasMore}
          loading={next.loading}
          isEmpty={data.length === 0}
          onLoad={() => next.loadMore()}
        />
      </div>
      <Modal
        title="编辑"
        open={modalOpen}
        maskClosable={false}
        onCancel={() => {
          setModalOpen(false);
        }}
        footer={null}
        afterClose={() => setEditItem(undefined)}
        destroyOnHidden
        width={600}
      >
        <PublishPost
          editType={editItem && editItem.updateContent ? "content" : "config"}
          editId={editItem?.id}
          initValues={editItem}
          onCreateOk={(id) => {
            setModalOpen(false);
            loadItem(id);
          }}
          onEditOk={(id) => {
            itemsCtrl.current?.reloadItem(id);
            setModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

async function getUserPostItem(id: number): Promise<Post> {
  const { items } = await getUserPostList({ post_id: id });
  const item = items[0];
  if (!item) throw new Error("帖子不存在");
  return item;
}
async function getUserPostList(param?: GetUserPostListParam): Promise<PostUserResponse> {
  return api["/post/user"].get({ query: param });
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
  box-sizing: border-box;
  padding: 0 12px 4px 12px;
  @media screen and (max-width: 400px) {
    padding: 0 6px 12px 6px;
  }
`;
const PostListCSS = css`
  position: relative;
  max-width: 650px;
  min-width: 300px;
  margin: 0 auto;

  height: 100%;
  overflow: auto;
`;
