import { PostGroupResponse, PostItemDto, UpdatePostParam } from "@/api.ts";
import { List, MenuProps, Modal } from "antd";
import styled from "@emotion/styled";
import { useAntdStatic } from "@/global-provider.tsx";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useRouteLoaderData, useSearchParams } from "react-router";
import { DeleteOutlined, EditOutlined, SettingOutlined, WarningOutlined } from "@ant-design/icons";
import { lazyPage } from "@/common/lazy_load_component.tsx";
import { api } from "@/common/http.ts";
import { PostQueryFilterContext, PostQueryFilter } from "../../layout/WallLayout.tsx";
import { useLayoutDirection, LayoutDirection } from "@/global-provider.tsx";
import { getUserInfoFromToken } from "@/common/user.ts";
import { ROUTES } from "@/app.ts";
import { InfiniteScrollHandle, InfiniteScrollLoad } from "@/lib/components/InfiniteLoad.tsx";
import wallCoverSrc from "./img/wall_cover.webp";
import { CreatePostBtn } from "../../components/PublishBtn.tsx";
import { ImageFitCover } from "@/lib/components/ImgFitCover.tsx";
import { useItemData } from "./useItemData.ts";
import { WallPostCard } from "./PostCard.tsx";
import { CommentDrawer, useCommentDrawer } from "./comment.tsx";

export function PostListPage() {
  const data = useRouteLoaderData<PostGroupResponse | undefined>("/wall");
  const { option, menus } = useMemo(() => {
    const option = data?.items.map((item) => ({
      label: item.group_name,
      value: item.group_id,
      desc: `${item.group_desc || ""}\n${item.rule_desc || ""}`,
    }));
    const menus: MenuProps["items"] = data?.items.map((item) => ({
      key: item.group_id.toString(),
      label: item.group_name,
    }));

    return { option, menus };
  }, [data]);

  const [search, setSearch] = useSearchParams();

  const drawer = useCommentDrawer(search, setSearch);

  return (
    <>
      <PostList groupOptions={option} onOpenComment={drawer.onOpenComment} />
      <CommentDrawer postId={drawer.commentId} onClose={drawer.closeCommentDrawer} />
    </>
  );
}
const Publish = lazyPage(() => import("../publish.tsx").then((mod) => mod.PublishPost));
type PostGroupOption = {
  label: string;
  value: number;
};

type PostLilstProps = {
  groupOptions?: PostGroupOption[];
  onOpenComment?: (postId: number) => void;
};

function PostList(props: PostLilstProps) {
  const { groupOptions, onOpenComment } = props;
  const filter = useContext(PostQueryFilterContext);
  const isSelf = filter.self;
  const { modal, message } = useAntdStatic();
  const navigate = useNavigate();
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<(UpdatePostParam & { id: number; updateContent?: boolean }) | undefined>(
    undefined,
  );

  const itemsCtrl = useItemData({ filter });
  const items = itemsCtrl.items;
  const onOpenPublish = () => {
    if (getUserInfoFromToken()?.valid) {
      setModalOpen(true);
    } else {
      navigate(ROUTES.Login + `?redirect=${location.pathname}`);
    }
  };
  const onEditPost = (item: PostItemDto, isEdit: boolean) => {
    setEditItem({
      id: item.asset_id,
      content_text: item.content_text,
      content_text_structure: item.content_text_structure,
      is_hide: item.config.self_visible,
      comment_disabled: item.config.comment_disabled,
      updateContent: isEdit,
    });
    setModalOpen(true);
  };
  const onDeletePost = (item: PostItemDto) => {
    modal.confirm({
      title: "删除确认",
      onOk: () => {
        return api["/post/content/:postId"].delete({ params: { postId: item.asset_id } }).then(() => {
          itemsCtrl.deleteItem(item.asset_id);
          message.success("删除成功");
        });
      },
    });
  };

  const pageRef = useRef<HTMLDivElement>(null);
  const scrollLoadRef = useRef<InfiniteScrollHandle>(null);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scrollLoadRef.current?.reset();
    itemsCtrl.setItems([]);
  }, [filter]);

  const isVertical = useLayoutDirection() === LayoutDirection.Vertical;
  return (
    <HomePageCSS>
      <InfiniteScrollLoad
        ref={scrollLoadRef}
        noMoreRender="可恶，到底了"
        className="post-list"
        loadMore={itemsCtrl.loadOldMore}
        onPush={(items) => {
          itemsCtrl.setItems((prev) => prev.concat(items));
        }}
        bottomThreshold={50}
      >
        <PostListCSS>
          <ImageFitCover src={wallCoverSrc}>
            <div style={{ display: isVertical ? "none" : "block", position: "absolute", right: 20, bottom: 20 }}>
              <CreatePostBtn icon={<EditOutlined />} onClick={onOpenPublish}>
                说点什么
              </CreatePostBtn>
            </div>
          </ImageFitCover>
          {filter.group?.group_desc && <StyledTip>{filter.group.group_desc}</StyledTip>}
          <List
            locale={{ emptyText: "-- 暂无数据 --" }}
            dataSource={items}
            itemLayout="vertical"
            renderItem={(item, index) => {
              const moreMenus: MenuProps["items"] = [{ icon: <WarningOutlined />, label: "举报", key: "report" }];
              if (item.curr_user) {
                if (item.curr_user.can_update) {
                  moreMenus.unshift(
                    { icon: <EditOutlined />, label: "编辑", key: "edit", onClick: () => onEditPost(item, true) },
                    {
                      icon: <SettingOutlined />,
                      label: "设置",
                      key: "setting",
                      onClick: () => onEditPost(item, false),
                    },
                    { icon: <DeleteOutlined />, label: "删除", key: "delete", onClick: () => onDeletePost(item) },
                  );
                }
              }
              return (
                <List.Item ref={index === 0 ? pageRef : undefined} key={item.asset_id} className="e2e-post-item">
                  <WallPostCard
                    item={item}
                    moreMenus={moreMenus}
                    onLike={itemsCtrl.onPostLike}
                    onOpenComment={onOpenComment}
                  />
                </List.Item>
              );
            }}
          />
        </PostListCSS>
      </InfiniteScrollLoad>

      <Modal
        title={editItem ? "编辑" : "发布"}
        open={modalOpen}
        maskClosable={false}
        onCancel={() => setModalOpen(false)}
        footer={null}
        afterClose={() => setEditItem(undefined)}
        destroyOnClose
        width={600}
      >
        <Publish
          disableEditContent={editItem && !editItem.updateContent}
          disableSetting={editItem && editItem.updateContent}
          editId={editItem?.id}
          initValues={editItem ? editItem : { group_id: filter.group?.group_id }}
          onCreateOk={(id) => {
            setModalOpen(false);
            debugger;
            if (isSelf) {
              itemsCtrl.loadNewest(id);
            } else {
              navigate("/wall/list/self");
            }
          }}
          onEditOk={(id) => {
            itemsCtrl.reloadItem(id);
            setModalOpen(false);
          }}
          groupOptions={groupOptions}
        />
      </Modal>
    </HomePageCSS>
  );
}

const StyledTip = styled.div`
  color: #ff9090;
  background-color: #fff;
  font-weight: 500;
  border-radius: 6px;
  padding: 8px;
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
  .ant-list-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
    > .ant-list-item {
      border-radius: 8px;
      padding: 0;
    }
  }
`;
