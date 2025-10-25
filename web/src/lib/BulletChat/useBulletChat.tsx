import { useEffect, useState } from "react";
import { BulletChatController, RenderOption } from "./BulletChatController.ts";
import { BulletChat } from "@/api.ts";

export function useBulletChat(props: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  genData: (signal: AbortSignal) => AsyncIterable<BulletChat>;
}) {
  const { containerRef, genData } = props;

  const [ctrl, setCtrl] = useState<BulletChatController<BulletChat> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ctrl = new BulletChatController<BulletChat>(container);
    ctrl.addItem(
      {
        id: "1",
        like_count: 1,
        text: "hello",
        user: { avatar_url: "", user_name: "nick", user_id: "1" },
      },
      100,
    );
    ctrl.onBeforeAppend = renderIItem;
    setCtrl(ctrl);
  }, []);

  useEffect(() => {
    if (!ctrl) return;
    const abc = new AbortController();
    (async () => {
      for await (const item of genData(abc.signal)) {
        ctrl.addItem(item, genRandomY(ctrl.dom.clientHeight - 100));
      }
    })();
    ctrl.start();

    return () => {
      abc.abort();
      ctrl.clear();
    };
  }, [ctrl]);
}
function genRandomY(maxHeight: number) {
  return Math.floor(Math.random() * maxHeight);
}

function renderIItem(item: HTMLElement, data: BulletChat, info: RenderOption) {
  item.className = "bullet-chat-item";
  item.innerText = data.text;
  item.style.top = `${info.y}px`;
  item.style.color = "#fff";

  const avatar = document.createElement("img");
  avatar.className = "bullet-chat-avatar";
  avatar.src = data.user.avatar_url;

  item.prepend(avatar);

  item.addEventListener("mouseenter", onMouseEnter);
  item.addEventListener("mouseleave", onMouseLeave);

  item.addEventListener("touchstart", onTouchStart);
}

function onMouseEnter(e: MouseEvent) {
  const element = e.target;
  if (!(element instanceof HTMLElement)) return;
  element.style.animationPlayState = "paused";
}
function onMouseLeave(e: MouseEvent) {
  const element = e.target;
  if (!(element instanceof HTMLElement)) return;
  element.style.animationPlayState = "running";
}
function onTouchStart(e: TouchEvent) {
  const element = e.target;
  if (!(element instanceof HTMLElement)) return;
  const state = element.style.animationPlayState;
  if (state === "running") element.style.animationPlayState = "paused";
  else element.style.animationPlayState = "running";
}
