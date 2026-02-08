import { Button, Spin } from "antd";
import { css } from "@emotion/css";
import { useThemeToken } from "@/provider/AntdProvider.tsx";

export type LoadMoreIndicatorProps = {
  error: boolean;
  loading: boolean;
  hasMore: boolean;
  isEmpty: boolean;
  onLoad: () => void;
};
export function LoadMoreIndicator(props: LoadMoreIndicatorProps) {
  const { onLoad, error: errored, hasMore, isEmpty, loading } = props;
  const renderIndicatorText = () => {
    if (loading) {
      return <Spin />;
    }

    if (errored) {
      return (
        <div>
          加载失败，点击
          <Button size="small" type="link" onClick={() => onLoad()}>
            重试
          </Button>
        </div>
      );
    }

    if (!hasMore) {
      if (isEmpty) {
        return "暂无数据";
      } else {
        return "可恶！到底了";
      }
    }
    return (
      <Button type="link" onClick={() => onLoad()}>
        加载更多
      </Button>
    );
  };
  return <LoaderIndicator>{renderIndicatorText()}</LoaderIndicator>;
}
export interface LoaderIndicatorProps {
  children?: React.ReactNode;
}
export function LoaderIndicator(props: LoaderIndicatorProps) {
  const theme = useThemeToken();
  return (
    <div className={StyledIndicator} style={{ color: theme.colorTextTertiary, fontSize: theme.fontSize }}>
      {props.children}
    </div>
  );
}
const StyledIndicator = css`
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 12px 0;
`;
