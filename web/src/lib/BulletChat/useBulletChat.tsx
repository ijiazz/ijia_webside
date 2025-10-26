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
    ctrl.onBeforeAppend = renderIItem;
    setCtrl(ctrl);
  }, []);

  useEffect(() => {
    if (!ctrl) return;
    const abc = new AbortController();
    (async () => {
      for await (const item of genData(abc.signal)) {
        await ctrl.addItemAsync(item);
      }
    })();
    ctrl.start();

    return () => {
      abc.abort();
      ctrl.clear();
    };
  }, [ctrl]);
}

function renderIItem(this: BulletChatController<BulletChat>, item: HTMLElement, data: BulletChat) {
  item.className = "bullet-chat-item";
  item.style.color = "#fff";
  item.appendChild(document.createTextNode(data.text));

  const avatar = document.createElement("img");
  avatar.className = "bullet-chat-avatar";
  avatar.src = data.user.avatar_url;

  item.prepend(avatar);

  const pauseItem = (e: MouseEvent) => {
    const element = e.target;
    if (!(element instanceof HTMLElement)) return;
    this.pausedItem(element);
  };
  item.addEventListener("mouseenter", pauseItem);
  item.addEventListener("mouseleave", (e) => {
    const element = e.target;
    if (!(element instanceof HTMLElement)) return;
    element.style.animationPlayState = "running";
    this.resumeItem(element);
  });
}
