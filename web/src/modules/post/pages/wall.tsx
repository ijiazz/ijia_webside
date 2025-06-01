import { PostGroupResponse, PostItemDto } from "@/api.ts";
import { useAsync } from "@/hooks/async.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { Avatar, Button, List, Menu, MenuProps, Modal, Tag } from "antd";
import styled from "@emotion/styled";
import { useThemeToken } from "@/hooks/antd.ts";
import { VLink } from "@/lib/components/VLink.tsx";
import { PostCardLayout, PostContent } from "../components/posts.tsx";
import React, { useMemo, useRef, useState } from "react";
import { useParams, useRouteLoaderData, useSearchParams } from "react-router";
import { PostHeader } from "../components/PostHeader.tsx";
import { PlusOutlined } from "@ant-design/icons";
import { lazyPage } from "@/common/lazy_load_component.tsx";

export function PostListPage() {
  const data = useRouteLoaderData<PostGroupResponse | undefined>("/wall");
  const { groupId } = useParams();
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
  return <PostList groupOptions={option} groupId={groupId} />;
}
const Publish = lazyPage(() => import("./publish.tsx").then((mod) => mod.PublishPost));
type PostGroupOption = {
  label: string;
  value: number;
};
function PostList(props: { groupId?: string; groupOptions?: PostGroupOption[] }) {
  const { groupId, groupOptions } = props;
  const { api } = useHoFetch();
  const [search, setSearch] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);

  const onOpenPublish = () => {
    //TODO: 检测是否已登录
    setModalOpen(true);
  };
  const pageRef = useRef<HTMLDivElement>(null);

  const { result, run, reset } = useAsync(
    (params: { cursor?: string; number?: number } = {}) => {
      const { cursor, number } = params;
      return api["/post/list"].get({ query: { cursor, number } }).then((item) => {
        const items = item.items.map((item) => ({
          ...item,
          publish_time: item.publish_time ? new Date(item.publish_time).toLocaleString() : null,
        }));
        return {
          ...item,
          items,
        };
      });
    },
    { autoRunArgs: [{}] },
  );
  const data = result.value || { items: [], total: 0, needLogin: false };
  const items: PostItemDto[] = data.items;
  const theme = useThemeToken();
  return (
    <PostListCSS>
      <PostListCSS>
        <Button type="primary" icon={<PlusOutlined />} onClick={onOpenPublish} style={{ marginBottom: 12 }}>
          发布
        </Button>
        <List
          style={{ backgroundColor: theme.colorBgLayout }}
          loading={result.loading}
          dataSource={items}
          itemLayout="vertical"
          renderItem={(item, index) => {
            const isAnonymous = item.config.is_anonymous;
            const author = item.author;
            const userName = isAnonymous ? <Tag>匿名用户</Tag> : author?.user_name;
            return (
              <List.Item
                ref={index === 0 ? pageRef : undefined}
                key={item.asset_id}
                style={{ background: theme.colorBgBase }}
              >
                <PostCardLayout
                  icon={
                    <VLink to={undefined} target="_blank">
                      <Avatar src={author?.avatar_url} />
                    </VLink>
                  }
                  header={
                    <PostHeader
                      userName={userName}
                      ipLocation={item.ip_location}
                      publishTime={item.publish_time?.toLocaleString()}
                    />
                  }
                >
                  <PostContent text={item.content_text} textStruct={item.content_text_structure} media={item.media} />
                </PostCardLayout>
              </List.Item>
            );
          }}
        />
      </PostListCSS>

      <Modal
        title="发布"
        open={modalOpen}
        maskClosable={false}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
      >
        <Publish
          onOk={() => {
            setModalOpen(false);
            run();
          }}
          groupOptions={groupOptions}
        />
      </Modal>
    </PostListCSS>
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
