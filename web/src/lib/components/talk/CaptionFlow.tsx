import styled from "@emotion/styled";
import React, { CSSProperties, useEffect, useMemo, useRef } from "react";
import { Caption, CaptionSegment } from "./type.ts";

type CaptionFlowProps = {
  style?: CSSProperties;
  delay?: number;
  text?: Caption | string;
};
export function CaptionFlow(props: CaptionFlowProps) {
  const { text, delay = 0, style } = props;
  const ref = useRef<HTMLSpanElement>(null);

  const initSegments = useMemo((): Char[] | string => {
    if (!text) return "";
    if (typeof text === "string") return text;

    return normalizeSegments({ ...text, delay });
  }, [text]);

  useEffect(() => {
    const container = ref.current!;
    if (typeof initSegments === "string") {
      container.innerText = initSegments;
      return;
    }
    playFlashText(initSegments, container);
  }, [initSegments]);

  return <CaptionFlowCSS className="flash-text" style={style} ref={ref}></CaptionFlowCSS>;
}
type Char = {
  className?: string;
  delay: number;
  char: string;
};

const defaultClassname = "flash-text-char";
const CaptionFlowCSS = styled.span`
  display: inline-block;
  min-height: 1em;
  min-width: 1em;
  white-space: pre-wrap;
  .flash-text-char {
    animation: flash 0.1s;
    animation-fill-mode: backwards;
    animation-timing-function: ease;
  }
  @keyframes flash {
    0% {
      display: none;
      font-weight: 600;
    }

    100% {
      display: inline;
      font-weight: 400;
    }
  }
`;
function playFlashText(char: Char[], container: HTMLElement) {
  const children = container.childNodes;
  for (let i = children.length - 1; i >= 0; i--) {
    container.removeChild(children[i]);
  }
  container.appendChild(document.createTextNode(" "));
  for (let i = 0; i < char.length; i++) {
    const item = char[i];
    const span = document.createElement("span");
    span.className = item.className ? defaultClassname + " " + item.className : defaultClassname;
    span.style.animationDelay = item.delay + "ms";
    span.innerText = item.char;
    container.appendChild(span);
  }
  container.appendChild(document.createTextNode(" "));
}

function normalizeSegments(option: Caption & { delay?: number }): Char[] {
  const { text, delay = 0, segments = [], speed = 100, pauseMs: pauseMs = (1000 / speed) * 3 } = option;
  if (speed < 0) throw new Error("speed must be greater than 0");
  if (pauseMs < 0) throw new Error("pause_ms must be greater than 0");

  const newSegments: Char[] = new Array(text.length);
  const globalTime = Math.floor(1000 / speed);

  let timeOffset = delay;
  let offset = 0;
  for (let i = 0; i < segments.length; i++) {
    const chunk = segments[i];
    const segment: CaptionSegment = typeof chunk === "number" ? { length: chunk } : chunk;
    if (segment.length) {
      const time = segment.speed ? Math.floor(1000 / segment.speed) : globalTime;
      for (let j = 0; j < segment.length; j++) {
        timeOffset += time;
        newSegments[offset] = {
          delay: timeOffset,
          char: text[offset],
        };
        offset++;
      }
      timeOffset += segment.pauseMs ?? pauseMs;
    }
  }
  for (let i = offset; i < text.length; i++) {
    timeOffset += globalTime;
    newSegments[i] = {
      delay: timeOffset,
      char: text[i],
    };
  }
  return newSegments;
}
