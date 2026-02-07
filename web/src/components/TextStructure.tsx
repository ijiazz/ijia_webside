import { type TextStructure, TextStructureExternalLink, TextStructureType } from "@/api.ts";
import { useThemeToken } from "@/provider/mod.tsx";
import { useMemo, useState } from "react";
import { ReactNode } from "react";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import { Link } from "@tanstack/react-router";
import styled from "@emotion/styled";
const { Paragraph } = Typography;
export type TextStructProps = Pick<React.HTMLAttributes<HTMLDivElement>, "className" | "style"> & {
  text?: string | null;
  structure?: TextStructure[] | null;
};
export function TextStruct(props: TextStructProps) {
  const { structure, text, style, ...rest } = props;
  const theme = useThemeToken();
  const split = useMemo(() => {
    if (!structure?.length || !text) return text;
    const list: ReactNode[] = [];
    let offset = 0;
    for (let i = 0; i < structure.length; i++) {
      const item = structure[i];
      if (item.index > offset) {
        list.push(text.slice(offset, item.index));
      }
      offset = item.index + item.length;
      const xText = text.slice(item.index, offset);
      const node = createTextNode(item, xText, i.toString());
      list.push(node);
    }
    if (offset < text.length) list.push(text.slice(offset));
    return list;
  }, [structure, text]);

  const [expanded, setExpanded] = useState(false);

  return (
    <StyledTextStruct {...rest}>
      <Paragraph
        ellipsis={{
          rows: 10,
          expandable: "collapsible",
          expanded,
          onExpand: () => setExpanded(true),
          onEllipsis: () => setExpanded(false),
          symbol(expanded) {
            return (
              <div style={{ color: theme.colorPrimaryText }}>
                {expanded ? (
                  <>
                    <UpOutlined />
                    收起
                  </>
                ) : (
                  <>
                    <DownOutlined /> 展开
                  </>
                )}
              </div>
            );
          },
        }}
      >
        {split}
      </Paragraph>
    </StyledTextStruct>
  );
}
const StyledTextStruct = styled.div`
  white-space: pre-wrap;
  color: red;
`;
function createTextNode(struct: TextStructure, text: string, key: string): ReactNode {
  if (!struct || !text) return text;
  switch (struct.type) {
    case TextStructureType.link: {
      const node = struct as TextStructureExternalLink;
      return (
        <Link key={key} to={node.link} target="_blank" rel="noopener noreferrer">
          {text}
        </Link>
      );
    }
    case TextStructureType.user:
      return (
        <span key={key} style={{ color: "blue" }}>
          {text}
        </span>
      );
    case TextStructureType.topic:
      return (
        <span key={key} style={{ color: "green" }}>
          {text}
        </span>
      );
    default:
      return <span key={key}>{text}</span>;
  }
}
