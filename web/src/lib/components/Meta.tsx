import { ReactNode } from "react";
import { useThemeToken } from "@/hooks/antd.ts";
import styled from "@emotion/styled";

export function Meta(props: { icon?: ReactNode; title?: ReactNode; description?: ReactNode }) {
  const { icon, description, title } = props;
  const token = useThemeToken();
  return (
    <MetaCSS>
      {icon}
      <div className="text">
        <div className="title" style={{ fontWeight: token.fontWeightStrong, flexShrink: 0 }}>
          {title}
        </div>
        <div className="description" style={{ color: token.colorTextDescription }}>
          {description}
        </div>
      </div>
    </MetaCSS>
  );
}
const MetaCSS = styled.div`
  margin: 8px 12px;
  display: flex;
  gap: 8px;
  align-items: center;
  .text {
    .title {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }
    .description {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
      -webkit-line-clamp: 2;
    }
  }
`;
