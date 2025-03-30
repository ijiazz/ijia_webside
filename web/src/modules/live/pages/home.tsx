import { AssetItemDto } from "@/api.ts";
import { THIRD_PART } from "@/common/third_part_account.tsx";
import { useAsync } from "@/hooks/async.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { Avatar, List, Space, Button, Empty } from "antd";
import styled from "@emotion/styled";
import { useThemeToken } from "@/hooks/antd.ts";
import { VLink } from "@/lib/components/VLink.tsx";
import { PostCardLayout, PostContent } from "../components/posts.tsx";
import React, { useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { ExportOutlined } from "@ant-design/icons";
import { ROUTES } from "@/app.ts";
const DEFAULT_PAGE_SIZE = 10;
export function HomePage() {
  const { api } = useHoFetch();
  const loc = useLocation();
  const [search, setSearch] = useSearchParams();
  const pageRef = useRef<HTMLDivElement>(null);
  const param = useMemo(() => {
    const page = search.get("page") ?? "1";
    return {
      page: +page,
      pageSize: DEFAULT_PAGE_SIZE,
    };
  }, [search]);
  const changePage = (page: number) => {
    const newSearch = new URLSearchParams(search);
    newSearch.set("page", page.toString());
    setSearch(newSearch);
  };

  const { result, run } = useAsync((params: { page: number; pageSize: number }) => {
    const { page, pageSize } = params;
    return api["/live/posts"].get({ query: { offset: (page - 1) * pageSize, number: pageSize } }).then((item) => {
      const items = item.items.map((item) => ({
        ...item,
        publish_time: item.publish_time ? new Date(item.publish_time).toLocaleString() : null,
      }));
      return {
        ...item,
        items,
      };
    });
  });
  useEffect(() => {
    run(param);
  }, [param.page]);
  const data = result.value;
  const items: AssetItemDto[] = result.value?.items ?? [];
  const theme = useThemeToken();
  return (
    <HomePageCSS>
      <PostListCSS style={{ backgroundColor: theme.colorBgLayout }}>
        {data?.needLogin && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 48 }}>
            <Link to={ROUTES.LOGIN} viewTransition>
              登录后查看更多
            </Link>
          </div>
        )}
        <List
          pagination={{
            current: param.page,
            pageSize: param.pageSize,
            total: result.value?.total,
            showSizeChanger: false,
            showQuickJumper: true,
            onChange(page, pageSize) {
              pageRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
              return changePage(page);
            },
          }}
          loading={result.loading}
          dataSource={items}
          itemLayout="vertical"
          renderItem={(item, index) => {
            return (
              <List.Item
                ref={index === 0 ? pageRef : undefined}
                key={item.platform + "-" + item.asset_id}
                style={{ background: theme.colorBgBase }}
              >
                <PostCardLayout
                  icon={
                    <VLink to={item.author.home_page} target="_blank">
                      <Avatar src={item.author.avatar_url} />
                    </VLink>
                  }
                  header={<PostHeader item={item} />}
                >
                  <PostContent item={item} />
                </PostCardLayout>
              </List.Item>
            );
          }}
        />
      </PostListCSS>
    </HomePageCSS>
  );
}
function PostHeader(props: { item: AssetItemDto }) {
  const { item } = props;
  const theme = useThemeToken();
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div>
        <Space>
          <b>{item.author.user_name}</b>
          <span>{THIRD_PART[item.platform].iconOutline}</span>
        </Space>
        <div style={{ color: theme.colorTextDescription, fontSize: theme.fontSizeSM }}>
          <Space>
            {item.publish_time?.toLocaleString()}
            <span> {item.ip_location ? "IP: " + item.ip_location : undefined}</span>
          </Space>
        </div>
      </div>
      <div>
        {item.url && (
          <VLink to={item.url} style={{ color: "inherit" }} target="_blank">
            <Button type="text" icon={<ExportOutlined />}></Button>
          </VLink>
        )}
      </div>
    </div>
  );
}
const HomePageCSS = styled.div`
  padding: 12px 24px;
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
