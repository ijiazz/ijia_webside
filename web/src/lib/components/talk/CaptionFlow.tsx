import styled from "@emotion/styled";
import React, { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { CaptionSegment, CaptionStruct } from "./type.ts";

type CaptionFlowProps = {
  text?: string;
  struct?: CaptionStruct;
  style?: CSSProperties;
  delay?: number;
  play?: boolean;
};
export function CaptionFlow(props: CaptionFlowProps) {
  const { text = "", struct, style } = props;
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current!;
    const chars: HTMLSpanElement[] = [];
  }, []);

  const children = useMemo(() => {
    let list: ReactNode[] = [];

    let i = 0;

    for (; i < text.length; i++) {
      list.push(
        <span key={i} className="flash-text-char">
          {text[i]}
        </span>,
      );
    }
    return list;
  }, [props.text]);

  return (
    <CaptionFlowCSS className="flash-text" style={style} ref={ref}>
      {children}
    </CaptionFlowCSS>
  );
}

const CaptionFlowCSS = styled.span`
  @keyframes flash {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  .flash-text-char {
    animation: alternate 1s;
  }
`;
