import { PlatformPostItemDto } from "@/api.ts";
import { THIRD_PART } from "@/common/third_part_account.tsx";
import { useAsync } from "@/hooks/async.ts";
import { Avatar, List, Button } from "antd";
import styled from "@emotion/styled";
import { useThemeToken } from "@/hooks/antd.ts";
import { VLink } from "@/lib/components/VLink.tsx";
import { PostContent } from "../components/PostContent.tsx";
import React, { useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { ExportOutlined } from "@ant-design/icons";
import { ROUTES } from "@/app.ts";
import { PostHeader } from "../components/PostHeader.tsx";
import { api } from "@/common/http.ts";
import { CardLayout } from "@/lib/components/card/card.tsx";
const DEFAULT_PAGE_SIZE = 10;
export function HomePage() {
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

  const {
    data = { items: [], total: 0, needLogin: false },
    loading,
    run,
  } = useAsync((params: { page: number; pageSize: number }) => {
    const { page, pageSize } = params;
    return api["/post/god_list"].get({ query: { offset: (page - 1) * pageSize, number: pageSize } }).then((item) => {
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
  const items: PlatformPostItemDto[] = data.items;
  const theme = useThemeToken();
  return (
    <HomePageCSS>
      <PostListCSS style={{ backgroundColor: theme.colorBgLayout }}>
        {data?.needLogin && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 48 }}>
            <Link to={ROUTES.Login} viewTransition>
              登录后查看更多
            </Link>
          </div>
        )}
        <List
          pagination={
            items.length < data.total
              ? {
                  current: param.page,
                  pageSize: param.pageSize,
                  total: data.total,
                  showSizeChanger: false,
                  showQuickJumper: data.total > param.pageSize * 6,
                  onChange(page, pageSize) {
                    pageRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                    return changePage(page);
                  },
                }
              : undefined
          }
          loading={loading}
          dataSource={items}
          itemLayout="vertical"
          renderItem={(item, index) => {
            return (
              <List.Item
                ref={index === 0 ? pageRef : undefined}
                key={item.platform + "-" + item.asset_id}
                style={{ background: theme.colorBgBase }}
              >
                <CardLayout
                  icon={
                    <VLink to={item.author.home_page} target="_blank">
                      <Avatar src={item.author.avatar_url} />
                    </VLink>
                  }
                  header={
                    <PostHeader
                      userName={item.author.user_name}
                      ipLocation={item.ip_location}
                      publishTime={item.publish_time?.toLocaleString()}
                      platformIcon={THIRD_PART[item.platform]?.iconOutline}
                    />
                  }
                  extra={
                    item.url && (
                      <VLink to={item.url} style={{ color: "inherit" }} target="_blank">
                        <Button type="text" icon={<ExportOutlined />}></Button>
                      </VLink>
                    )
                  }
                >
                  <PostContent text={item.content_text} textStruct={item.content_text_structure} media={item.media} />
                </CardLayout>
              </List.Item>
            );
          }}
        />
      </PostListCSS>
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
      padding: 0;
    }
  }
`;
