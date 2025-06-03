import { PostGroupResponse, PostItemDto, UpdatePostParam } from "@/api.ts";
import { Avatar, Button, Dropdown, List, MenuProps, Modal, Space, Spin, Tag } from "antd";
import styled from "@emotion/styled";
import { useThemeToken } from "@/hooks/antd.ts";
import { VLink } from "@/lib/components/VLink.tsx";
import { PostCardLayout, PostContent } from "../components/posts.tsx";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useRouteLoaderData, useSearchParams } from "react-router";
import { PostHeader } from "../components/PostHeader.tsx";
import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { lazyPage } from "@/common/lazy_load_component.tsx";
import { api } from "@/common/http.ts";
import { CurrentPostGroupContext } from "../layout/WallLayout.tsx";
import { AdaptiveLayoutContext, LayoutDirection } from "@/modules/layout/AdaptiveMenuLayout.tsx";
import { getUserInfoFromToken } from "@/common/user.ts";
import { ROUTES } from "@/app.ts";
import { useInfiniteLoad } from "@/lib/components/InfiniteLoad.tsx";
import { afterTime } from "evlib";

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
function PostList(props: { groupOptions?: PostGroupOption[] }) {
  const { groupOptions } = props;
  const currGroup = useContext(CurrentPostGroupContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<(UpdatePostParam & { id: number }) | undefined>(undefined);
  const onOpenPublish = () => {
    if (getUserInfoFromToken()?.valid) {
      setModalOpen(true);
    } else {
      navigate(ROUTES.Login + `?redirect=${location.pathname}`);
    }
  };
  const onEditPost = (item: PostItemDto) => {
    setEditItem({
      id: item.asset_id,
      content_text: item.content_text,
      content_text_structure: item.content_text_structure,
      is_hide: item.config.self_visible,
    });
    setModalOpen(true);
  };
  const onDeletePost = (item: PostItemDto) => {};
  const pageRef = useRef<HTMLDivElement>(null);

  const postData = useInfiniteLoad({
    loadMore: async (cursor?: string) => {
      await afterTime(1000);
      const groupId = currGroup?.groupId;
      const res = await api["/post/list"].get({ query: { cursor, group_id: groupId, number: 2 } });
      const items = res.items.map((item) => ({
        ...item,
        publish_time: item.publish_time ? new Date(item.publish_time).toISOString() : null,
      }));

      return {
        items: items,
        hasMore: res.has_more,
        nextParam: res.next_cursor,
      };
    },
  });
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (!isFirstRender.current) postData.reset();
    isFirstRender.current = false;
  }, [currGroup]);

  const items: PostItemDto[] = postData.data || [];

  const isVertical = useContext(AdaptiveLayoutContext) === LayoutDirection.Vertical;

  const theme = useThemeToken();
  return (
    <HomePageCSS>
      <PostListCSS>
        <div style={{ display: isVertical ? "none" : "block", marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={onOpenPublish}>
            发布
          </Button>
        </div>
        <div></div>
        <List
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
                  { icon: <EditOutlined />, label: "编辑", key: "edit", onClick: () => onEditPost(item) },
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
                      publishTime={item.publish_time?.toLocaleString()}
                      extra={
                        <Space size="small">
                          {item.config.self_visible && <Tag>仅自己可见</Tag>}
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
                  <PostContent text={item.content_text} textStruct={item.content_text_structure} media={item.media} />
                </PostCardLayout>
              </List.Item>
            );
          }}
        />
        <div>{postData.ref}</div>
      </PostListCSS>

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
          editId={editItem?.id}
          initValues={editItem}
          onOk={(isChange) => {
            setModalOpen(false);
            if (isChange) {
              //TODO 刷新
            }
          }}
          groupOptions={groupOptions}
        />
      </Modal>
    </HomePageCSS>
  );
}
const HomePageCSS = styled.div`
  padding: 12px 12px;
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
