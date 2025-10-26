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
  let hasMore = true;
  let offset = 0;
  while (hasMore) {
    if (signal.aborted) {
      return;
    }
    const res = await api["/live/screen/bullet-chart"].get({ query: { index: offset } });
    offset++;
    hasMore = res.has_more;
    for await (const item of res.items) {
      yield item;
      if (signal.aborted) {
        return;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return;
}
