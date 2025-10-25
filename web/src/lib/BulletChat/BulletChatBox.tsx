import { useRef } from "react";
import { useBulletChat } from "./useBulletChat.tsx";
import styled from "@emotion/styled";
import React from "react";

export function BulletChatBox(
  props: React.ComponentProps<"div"> & { genData: (signal: AbortSignal) => AsyncIterable<any> },
) {
  const { genData, ...rest } = props;
  const scRef = useRef<HTMLDivElement>(null);
  useBulletChat({ containerRef: scRef, genData: genData });
  return <StyledDiv {...rest} style={{ height: "100%", ...props.style }} ref={scRef} />;
}
const StyledDiv = styled.div`
  position: relative;
  overflow: hidden;
  pointer-events: none;
  .bullet-chat-item {
    pointer-events: all;
    position: absolute;
    left: 100%;
    white-space: nowrap;
  }
  .bullet-chat-avatar {
    width: 1.5em;
    height: 1.5em;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 0.2em;
    vertical-align: middle;
    overflow: hidden;
    border: 1px solid #fff;
  }
`;
