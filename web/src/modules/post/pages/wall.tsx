import { GetPostListParam, PostGroupResponse, PostItemDto, UpdatePostParam } from "@/api.ts";
import { Affix, Avatar, Button, Dropdown, List, MenuProps, Modal, Space, Spin, Tag, Tooltip } from "antd";
import styled from "@emotion/styled";
import { useAntdStatic, useThemeToken } from "@/hooks/antd.ts";
import { VLink } from "@/lib/components/VLink.tsx";
import { PostCardLayout, PostContent } from "../components/posts.tsx";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useRouteLoaderData, useSearchParams } from "react-router";
import {
  DeleteOutlined,
  EditOutlined,
  MessageOutlined,
  MoreOutlined,
  PlusOutlined,
  SettingOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { lazyPage } from "@/common/lazy_load_component.tsx";
import { api } from "@/common/http.ts";
import { CurrentPostGroupContext } from "../layout/WallLayout.tsx";
import { AdaptiveLayoutContext, LayoutDirection } from "@/modules/layout/AdaptiveMenuLayout.tsx";
import { getUserInfoFromToken } from "@/common/user.ts";
import { ROUTES } from "@/app.ts";
import { InfiniteScrollHandle, InfiniteScrollLoad } from "@/lib/components/InfiniteLoad.tsx";
import { LikeButton } from "../components/LikeButton.tsx";
// import wallCoverSrc from "../img/wall_cover.png";
const wallCoverSrc=""

export function PostListPage() {
  const data = useRouteLoaderData<PostGroupResponse | undefined>("/wall");
  const { option, menus } = useMemo(() => {
    const option = data?.items.map((item) => ({
      label: item.group_name,
      value: item.group_id,
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
function Cover() {
  return (
    <CoverCSS>
      <img className="bg-cover" src={wallCoverSrc} />
    </CoverCSS>
  );
}

const CoverCSS = styled.div`
  margin-bottom: 8px;
  .bg-cover {
    width: 100%;
    object-fit: cover;
  }
`;

function PostList(props: { groupOptions?: PostGroupOption[] }) {
  const { groupOptions } = props;
  const { modal, message } = useAntdStatic();
  const currGroup = useContext(CurrentPostGroupContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<(UpdatePostParam & { id: number; updateContent?: boolean }) | undefined>(
    undefined,
  );
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
          setItems((prev) => prev.filter((i) => i.asset_id !== item.asset_id));
          message.success("删除成功");
        });
      },
    });
  };
  const onPostLike = async (id: number, isCancel: boolean) => {
    setItems((prev) => {
      const index = prev.findIndex((i) => i.asset_id === id);
      if (index === -1) return prev;
      const item = prev[index].curr_user;
      if (!item) return prev;
      item.is_like = !isCancel;
      return [...prev];
    });
    try {
      await api["/post/like/:postId"].post({ params: { postId: id }, query: { isCancel } });
    } catch (error) {
      console.error(error);
      message.error(isCancel ? "取消点赞失败" : "点赞失败");
    }
    await reloadItem(id);
  };
  const pageRef = useRef<HTMLDivElement>(null);
  const scrollLoadRef = useRef<InfiniteScrollHandle>(null);

  const [items, setItems] = useState<PostItemDto[]>([]);
  const loadOldMore = async (cursor?: string) => {
    const groupId = currGroup?.groupId;
    return getPostList({ cursor, group_id: groupId });
  };
  const loadNewest = async (id?: number) => {
    if (typeof id === "number") {
      // 创建
      const { items } = await getPostList({ post_id: id });
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
  const reloadItem = async (id: number) => {
    const { items } = await getPostList({ post_id: id });
    const item = items[0];
    if (item) {
      setItems((prev) => {
        return prev.map((i) => (i.asset_id === item.asset_id ? item : i));
      });
    }
  };
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scrollLoadRef.current?.reset();
    setItems([]);
  }, [currGroup]);

  const isVertical = useContext(AdaptiveLayoutContext) === LayoutDirection.Vertical;

  const theme = useThemeToken();
  return (
    <HomePageCSS>
      <InfiniteScrollLoad
        ref={scrollLoadRef}
        noMoreRender="可恶，到底了"
        className="post-list"
        loadMore={loadOldMore}
        onPush={(items) => {
          setItems((prev) => prev.concat(items));
        }}
        bottomThreshold={50}
      >
        <PostListCSS style={{ position: "relative" }}>
          <Cover />
          <div style={{ display: isVertical ? "none" : "block", marginBottom: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={onOpenPublish}>
              发布
            </Button>
          </div>
          <div></div>
          <List
            locale={{ emptyText: "-- 暂无数据 --" }}
            style={{ backgroundColor: theme.colorBgLayout }}
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
                <List.Item
                  ref={index === 0 ? pageRef : undefined}
                  key={item.asset_id}
                  style={{ background: theme.colorBgBase }}
                >
                  <PostCardLayout
                    icon={
                      <VLink to={undefined} target="_blank">
                        <Avatar icon={author ? undefined : <UserOutlined />} src={author?.avatar_url} />
                      </VLink>
                    }
                    header={
                      <PostHeader
                        userName={userName}
                        ipLocation={item.ip_location}
                        publishTime={item.publish_time}
                        updateTime={item.update_time}
                        extra={
                          <Space size={0}>
                            {item.config.self_visible && <Tag>仅自己可见</Tag>}
                            {item.status.is_reviewing && <Tag color="blue">审核中</Tag>}
                            {item.status.review_pass === false && (
                              <Tooltip title={item.status.reason}>
                                <Tag color="red">审核不通过</Tag>
                              </Tooltip>
                            )}
                            {item.curr_user && (
                              <Dropdown menu={{ items: moreMenus }}>
                                <Button type="text" icon={<MoreOutlined />}></Button>
                              </Dropdown>
                            )}
                          </Space>
                        }
                      />
                    }
                  >
                    <Space>
                      <LikeButton
                        disabled={!item.curr_user?.can_update}
                        isLike={item.curr_user?.is_like}
                        onTrigger={(isCancel) => onPostLike(item.asset_id, isCancel)}
                      >
                        {item.stat.like_total}
                      </LikeButton>
                      <Button
                        disabled={!item.curr_user?.can_comment}
                        size="small"
                        icon={<MessageOutlined />}
                        type="text"
                      >
                        {item.stat.comment_total}
                      </Button>
                      {item.group?.group_name ? <Tag color="pink">{item.group.group_name}</Tag> : null}
                    </Space>
                    <PostContent text={item.content_text} textStruct={item.content_text_structure} media={item.media} />
                  </PostCardLayout>
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
          initValues={editItem}
          onCreateOk={(id) => {
            loadNewest(id);
            setModalOpen(false);
          }}
          onEditOk={(id) => {
            reloadItem(id);
            setModalOpen(false);
          }}
          groupOptions={groupOptions}
        />
      </Modal>
    </HomePageCSS>
  );
}

export type PostHeaderProps = {
  userName?: React.ReactNode;
  platformIcon?: React.ReactNode;
  publishTime?: React.ReactNode;
  updateTime?: React.ReactNode;
  ipLocation?: string | null;
  extra?: React.ReactNode;
};

export function PostHeader(props: PostHeaderProps) {
  const theme = useThemeToken();
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div>
        <Space>
          <b>{props.userName}</b>
          <span>{props.platformIcon}</span>
        </Space>
        <div style={{ color: theme.colorTextDescription, fontSize: theme.fontSizeSM }}>
          <Space>
            {props.publishTime}
            {props.updateTime ? <span>更新于 {props.updateTime}</span> : undefined}
            <span> {props.ipLocation ? "IP: " + props.ipLocation : undefined}</span>
          </Space>
        </div>
      </div>
      <div>{props.extra}</div>
    </div>
  );
}
async function getPostList(param?: GetPostListParam) {
  return api["/post/list"].get({ query: param }).then((res) => {
    for (const item of res.items) {
      if (item.publish_time) {
        item.publish_time = new Date(item.publish_time).toLocaleString();
      }
      if (item.update_time) {
        item.update_time = item.publish_time ? new Date(item.update_time).toLocaleString() : null;
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
    padding: 12px 12px 4px 12px;
    height: 100%;
    overflow: auto;
  }
`;
const PostListCSS = styled.div`
  max-width: 650px;
  min-width: 300px;
  margin: 0 auto;
  .ant-list-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
    > .ant-list-item {
      border-radius: 8px;
    }
  }
`;
