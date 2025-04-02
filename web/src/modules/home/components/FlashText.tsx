import styled from "@emotion/styled";
import anime from "animejs";
import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";

type FlashTextProps = {
  text: string;
  offset?: number;
};
export function FlashText(props: FlashTextProps) {
  const { text, offset = 2 } = props;
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current!;
    const chars: HTMLSpanElement[] = [];
    anime({
      targets: element.getElementsByClassName("flash-text-first"),
      translateX: 250,
      direction: "alternate",
      loop: true,
      easing: "steps(5)",
    });
  }, []);

  const children = useMemo(() => {
    let list: ReactNode[] = [];

    let i = 0;
    for (; i < offset; i++) {
      list.push(
        <span key={i} className="flash-text-char">
          {text[i]}
        </span>,
      );
    }
    for (; i < text.length; i++) {
      list.push(
        <span key={i} className="flash-text-char">
          {text[i]}
        </span>,
      );
    }
    return list;
  }, [props.text]);

  return <FlashTextCSS ref={ref}>{children} </FlashTextCSS>;
}

const FlashTextCSS = styled.span`
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
