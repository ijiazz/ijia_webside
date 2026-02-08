import { ReactNode } from "react";
import { useThemeToken } from "@/provider/mod.tsx";
import { css } from "@emotion/css";

export function Meta(props: { icon?: ReactNode; title?: ReactNode; description?: ReactNode }) {
  const { icon, description, title } = props;
  const token = useThemeToken();
  return (
    <div className={MetaCSS}>
      {icon}
      <div className="text">
        <div className="title" style={{ fontWeight: token.fontWeightStrong, flexShrink: 0 }}>
          {title}
        </div>
        <div className="description" style={{ color: token.colorTextDescription }}>
          {description}
        </div>
      </div>
    </div>
  );
}
const MetaCSS = css`
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
