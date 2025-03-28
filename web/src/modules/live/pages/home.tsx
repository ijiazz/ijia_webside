import { AssetItemDto } from "@/api.ts";
import { THIRD_PART } from "@/common/third_part_account.tsx";
import { useAsync } from "@/hooks/async.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { Avatar, List, Space } from "antd";
import styled from "@emotion/styled";
import { useThemeToken } from "@/hooks/antd.ts";
import { VLink } from "@/lib/components/VLink.tsx";
import { PostCardLayout, PostText } from "../components/posts.tsx";
import { mockAssetItemDtoArray } from "./home_mock.ts";

export function HomePage() {
  const { api } = useHoFetch();
  const { result } = useAsync(
    () => {
      return api["/live/asset"].get();
    },
    { autoRunArgs: [] },
  );

  //   const items: AssetItemDto[] = result.value?.items;
  const items: AssetItemDto[] = mockAssetItemDtoArray;
  const theme = useThemeToken();
  return (
    <HomePageCSS>
      <AssetListCSS style={{ backgroundColor: theme.colorBgLayout }}>
        <List
          dataSource={items}
          itemLayout="vertical"
          renderItem={(item) => {
            return (
              <List.Item key={item.platform + "-" + item.asset_id} style={{ background: theme.colorBgBase }}>
                <PostCardLayout
                  icon={
                    <VLink to={item.author.home_page} target="_blank">
                      <Avatar src={item.author.avatar_url} />
                    </VLink>
                  }
                  header={
                    <div>
                      <div>
                        <Space>
                          <b>{item.author.user_name}</b>
                          <span>{THIRD_PART[item.platform].iconOutline}</span>
                        </Space>
                      </div>
                      <div style={{ color: theme.colorTextDescription, fontSize: theme.fontSizeSM }}>
                        <Space>
                          {item.publish_time?.toLocaleString()}
                          <span>IP: {item.ip_location}</span>
                        </Space>
                      </div>
                    </div>
                  }
                >
                  <VLink to={item.url} target="_blank">
                    <PostContent item={item} />
                  </VLink>
                </PostCardLayout>
              </List.Item>
            );
          }}
        ></List>
      </AssetListCSS>
      <div></div>
    </HomePageCSS>
  );
}
const HomePageCSS = styled.div`
  padding: 12px 24px;
`;
const AssetListCSS = styled.div`
  max-width: 650px;
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

function PostContent(props: { item: AssetItemDto }) {
  const { item } = props;
  return (
    <div>
      <PostText text={item.content_text} structure={[]} />
    </div>
  );
}
