import { Button, Spin } from "antd";
import { css } from "@emotion/css";
import { useThemeToken } from "@/provider/AntdProvider.tsx";

export type LoadMoreIndicatorProps = {
  error: boolean;
  loading: boolean;
  hasMore: boolean;
  isEmpty: boolean;
  onLoad: () => void;
  ref?: React.Ref<HTMLDivElement>;
};
export function LoadMoreIndicator(props: LoadMoreIndicatorProps) {
  const { onLoad, error: errored, hasMore, isEmpty, loading, ...rest } = props;
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
      <Button size="small" type="link" onClick={() => onLoad()}>
        加载更多
      </Button>
    );
  };
  return <LoaderIndicator {...rest}>{renderIndicatorText()}</LoaderIndicator>;
}
export interface LoaderIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}
export function LoaderIndicator(props: LoaderIndicatorProps) {
  const theme = useThemeToken();
  return (
    <div
      {...props}
      className={StyledIndicator}
      style={{ color: theme.colorTextTertiary, fontSize: theme.fontSize, ...props.style }}
    >
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
