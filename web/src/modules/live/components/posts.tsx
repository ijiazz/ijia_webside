import styled from "@emotion/styled";
import { PropsWithChildren, ReactNode } from "react";

export type PostCardProps = {
  icon?: ReactNode;
  header?: ReactNode;
  style?: React.CSSProperties;
};
export function PostCardLayout(props: PropsWithChildren<PostCardProps>) {
  return (
    <UserMetaCSS>
      {props.icon}
      {props.header}
      <div></div>
      {props.children}
    </UserMetaCSS>
  );
}
const UserMetaCSS = styled.div`
  margin: 8px 12px;
  display: grid;
  grid-template-columns: 40px auto;
  gap: 8px;
  align-items: center;
  .text {
  }
`;
export function PostText(props: { text?: string | null; structure?: unknown[] }) {
  const { structure, text } = props;
  return text;
}
