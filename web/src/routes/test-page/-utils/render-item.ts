import { BulletChat } from "@/api.ts";
import { RenderOption } from "../-component/BulletChatController.ts";

export function renderIItem(item: HTMLElement, data: BulletChat, info: RenderOption) {
  item.className = "bullet-chat-item";
  item.innerText = data.text;
  item.style.top = `${info.y}px`;
  item.style.color = "#fff";

  item.addEventListener("mouseenter", onMouseEnter);
  item.addEventListener("mouseleave", onMouseLeave);

  item.addEventListener("touchstart", onTouchStart);

  const avatar = document.createElement("img");
  avatar.className = "bullet-chat-avatar";
  avatar.src = data.user.avatar_url;

  item.prepend(avatar);
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
