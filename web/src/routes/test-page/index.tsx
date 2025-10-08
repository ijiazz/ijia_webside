import { createFileRoute } from "@tanstack/react-router";
import { BulletChat } from "@/api.ts";
import React, { useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { BulletChatController } from "./-component/BulletChatController.ts";
import { renderIItem } from "./-utils/render-item.ts";
export const Route = createFileRoute("/test-page/")({
  component: RouteComponent,
});

function RouteComponent() {
  const scRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = scRef.current;
    if (!container) return;
    const ctrl = new BulletChatController<BulletChat>(container);
    ctrl.addItem(
      {
        id: "1",
        like_count: 1,
        text: "hello",
        user: { avatar_url: "", nickname: "nick", user_id: "1" },
      },
      100,
    );
    ctrl.renderItem = renderIItem;
    const abc = new AbortController();
    (async () => {
      for await (const item of genItems(abc.signal)) {
        ctrl.addItem(item, genRandomY(container.clientHeight));
      }
    })();
    return () => {
      abc.abort();
    };
  }, []);
  return <StyledDiv ref={scRef} />;
}
const StyledDiv = styled.div`
  position: relative;
  width: 850px;
  height: 600px;
  background-color: #999;
  overflow: hidden;

  .bullet-chat-item {
    position: absolute;
    left: 100%;
    white-space: nowrap;
    width: 100%;

    animation-name: move-left;
    animation-duration: 5s;
    animation-timing-function: linear;
    animation-iteration-count: 1;
    animation-play-state: running;
    animation-fill-mode: forwards;
  }

  @keyframes move-left {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-100%);
    }
  }
`;

async function* genItems(signal: AbortSignal) {
  for (let i = 0; ; i++) {
    yield {
      id: `${i}`,
      like_count: i,
      text: `hello ${i}`,
      user: { avatar_url: "", nickname: `nickname ${i}`, user_id: `${i}` },
    };
    await new Promise((r) => setTimeout(r, 300));
    if (signal.aborted) {
      break;
    }
  }
}
function genRandomY(maxHeight: number) {
  return Math.floor(Math.random() * maxHeight);
}
