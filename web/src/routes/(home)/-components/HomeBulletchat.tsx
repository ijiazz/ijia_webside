import { api } from "@/common/http.ts";
import { BulletChatBox } from "@/lib/BulletChat/BulletChatBox.tsx";
import React from "react";

export function HomeBulletChat(props: {}) {
  return (
    <BulletChatBox
      genData={genItems}
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100vh" }}
    />
  );
}
async function* genItems(signal: AbortSignal) {
  //TODO
  return;
  const { items, total } = await api["/live/screen/avatar"].get({ query: { number: 400 } });

  for (let i = 0; ; i++) {
    let offset = i % items.length;
    const item = items[i];
    if (!item) break;
    yield {
      id: i,
      text: `测试弹幕 ${i}`,
      user: { avatar_url: item.avatar_url, nickname: item.name, user_id: item.id },
    };
    await new Promise((r) => setTimeout(r, 300));
    if (signal.aborted) {
      break;
    }
  }
}
