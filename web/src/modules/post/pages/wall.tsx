import { GetPostListParam, PostGroupResponse, PostItemDto, UpdatePostParam } from "@/api.ts";
import { Avatar, Button, Dropdown, List, MenuProps, Modal, Space, Tag, Tooltip } from "antd";
import styled from "@emotion/styled";
import { useAntdStatic, useThemeToken } from "@/global-provider.tsx";
import { VLink } from "@/lib/components/VLink.tsx";
import { PostContent } from "../components/PostContent.tsx";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useRouteLoaderData, useSearchParams } from "react-router";
import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  SettingOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { lazyPage } from "@/common/lazy_load_component.tsx";
import { api } from "@/common/http.ts";
import { PostQueryFilterContext, PostQueryFilter } from "../layout/WallLayout.tsx";
import { useLayoutDirection, LayoutDirection } from "@/global-provider.tsx";
import { getUserInfoFromToken } from "@/common/user.ts";
import { ROUTES } from "@/app.ts";
import { InfiniteScrollHandle, InfiniteScrollLoad } from "@/lib/components/InfiniteLoad.tsx";
import wallCoverSrc from "../img/wall_cover.webp";
import { PinkPostCard } from "../components/PinkCard.tsx";
import { CreatePostBtn } from "../components/PublishBtn.tsx";
import { ImageFitCover } from "@/lib/components/ImgFitCover.tsx";
import { PostFooter } from "../components/PostFooter.tsx";
import { dateToString } from "@/common/date.ts";

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
  return <PostList groupOptions={option} />;
}
const Publish = lazyPage(() => import("./publish.tsx").then((mod) => mod.PublishPost));
type PostGroupOption = {
  label: string;
  value: number;
};

function PostList(props: { groupOptions?: PostGroupOption[]; currGroup?: PostQueryFilter | null; self?: boolean }) {
  const { groupOptions, self: isSelf } = props;
  const filter = useContext(PostQueryFilterContext);
  const { modal, message } = useAntdStatic();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useSearchParams();
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
  const theme = useThemeToken();
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
              const isAnonymous = item.config.is_anonymous;
              const author = item.author;
              const userName = isAnonymous ? (
                <Tag bordered={false} color={theme.colorTextSecondary}>
                  匿名
                </Tag>
              ) : (
                author?.user_name
              );

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
                <List.Item ref={index === 0 ? pageRef : undefined} key={item.asset_id}>
                  <PinkPostCard
                    icon={
                      <VLink to={undefined} target="_blank">
                        <Avatar icon={author ? undefined : <UserOutlined />} src={author?.avatar_url} />
                      </VLink>
                    }
                    header={{
                      userName,
                      ipLocation: item.ip_location,
                      publishTime: item.publish_time,
                      updateTime: item.update_time,
                    }}
                    extra={
                      <Space size={0}>
                        {item.group?.group_name ? <Tag color="pink">{item.group.group_name}</Tag> : null}
                        {item.config.self_visible && <Tag>仅自己可见</Tag>}
                        {item.status.is_reviewing && <Tag color="blue">审核中</Tag>}
                        {item.status.review_pass === false && (
                          <Tooltip title={item.status.reason}>
                            <Tag color="red">审核不通过</Tag>
                          </Tooltip>
                        )}
                        {item.curr_user && (
                          <Dropdown menu={{ items: moreMenus }}>
                            <Button className="e2e-post-item-extra-btn" type="text" icon={<MoreOutlined />}></Button>
                          </Dropdown>
                        )}
                      </Space>
                    }
                    footer={
                      <PostFooter
                        commentCount={item.stat.comment_total}
                        isLike={item.curr_user?.is_like}
                        likeCount={item.stat.like_total}
                        likeDisabled={!item.curr_user}
                        onPostLike={(isCancel) => itemsCtrl.onPostLike(item.asset_id, isCancel)}
                        onOpenComment={() => {}}
                      />
                    }
                  >
                    <div>
                      <PostContent
                        text={item.content_text}
                        textStruct={item.content_text_structure}
                        media={item.media}
                      />
                    </div>
                  </PinkPostCard>
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
function useItemData(option: { filter?: PostQueryFilter } = {}) {
  const { filter = {} } = option;
  const [items, setItems] = useState<PostItemDto[]>([]);
  const reloadingRef = useRef<Record<number, Promise<any>>>({});
  const loadOldMore = (cursor?: string) => {
    return getPostList({ cursor, group_id: filter.group?.group_id, self: filter.self });
  };
  const loadNewest = async (id?: number) => {
    if (typeof id === "number") {
      // 创建
      const { items } = await getPostList({ post_id: id, group_id: filter.group?.group_id, self: filter.self });
      if (items.length > 0) {
        setItems((prev) => {
          const newItem = items[0];
          return [newItem, ...prev];
        });
      }
    } else {
      //TODO 获取最新
    }
  };
  const reloadItem = (id: number) => {
    const reloadIng = reloadingRef.current;
    const promise = getPostList({ post_id: id, group_id: filter.group?.group_id, self: filter.self })
      .then((res) => {
        if (reloadIng[id] === undefined) return; // 已被后调用来的更新

        const item = res.items[0];
        if (!item) return;

        setItems((prev) => {
          return prev.map((i) => (i.asset_id === item.asset_id ? item : i));
        });
      })
      .finally(() => {
        if (reloadIng[id] === promise) delete reloadIng[id];
      });
    reloadIng[id] = promise;
    return promise;
  };
  const deleteItem = (id: number) => {
    setItems((prev) => prev.filter((i) => i.asset_id !== id));
  };
  const replaceItem = (postId: number, replaceFn: (old: PostItemDto) => PostItemDto) => {
    setItems((prev) => {
      return prev.map((item) => {
        if (item.asset_id === postId) {
          return replaceFn(item);
        }
        return item;
      });
    });
  };

  const { message } = useAntdStatic();
  const onPostLike = (id: number, isCancel: boolean) => {
    replaceItem(id, (old) => {
      const c = old.curr_user;
      if (c) {
        c.is_like = !isCancel;
        if (isCancel) old.stat.like_total--;
        else old.stat.like_total++;
      }
      return old;
    });
    const reloading = reloadingRef.current;
    const promise = api["/post/like/:postId"].post({ params: { postId: id }, query: { isCancel } });
    if (!reloading[id]) {
      reloading[id] = promise;
    }

    promise
      .then(
        (res) => res.success,
        (error) => {
          console.error(error);
          message.error(isCancel ? "取消点赞失败" : "点赞失败");
          return false;
        },
      )
      .then((success: boolean) => {
        if (reloading[id] === promise) {
          //这个过程这个帖子没有被请求刷新过
          delete reloading[id];
          if (!success) {
            replaceItem(id, (old) => {
              const c = old.curr_user;
              if (c) {
                c.is_like = !c.is_like;
                if (isCancel) old.stat.like_total++;
                else old.stat.like_total--;
              }
              return old;
            });
          }
        } else {
          return reloadItem(id);
        }
      });
  };
  return { items, setItems, loadOldMore, loadNewest, reloadItem, deleteItem, replaceItem, onPostLike };
}
async function getPostList(param?: GetPostListParam) {
  return api["/post/list"].get({ query: param }).then((res) => {
    for (const item of res.items) {
      if (item.publish_time) {
        item.publish_time = dateToString(item.publish_time, "minute");
      }
      if (item.update_time) {
        item.update_time = dateToString(item.update_time, "minute");
      }
    }

    return {
      items: res.items,
      hasMore: res.has_more,
      nextParam: res.next_cursor || undefined,
    };
  });
}
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
