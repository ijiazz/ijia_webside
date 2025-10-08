import { BulletChat } from "@/api.ts";
import { RenderOption } from "../-component/BulletChatController.ts";

export function renderIItem(item: HTMLElement, data: BulletChat, info: RenderOption) {
  item.className = "bullet-chat-item";
  item.innerText = data.text;
  item.style.top = `${info.y}px`;
  item.style.color = "#fff";

  const avatar = document.createElement("img");
  avatar.src = data.user.avatar_url;
  avatar.style.width = "1.1em";
  avatar.style.height = "1.1em";
  avatar.style.borderRadius = "50%";
  avatar.style.objectFit = "cover";
  avatar.style.marginRight = "8px";
  avatar.style.verticalAlign = "middle";
  avatar.style.overflow = "hidden";
  avatar.style.border = "1px solid #fff";

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
