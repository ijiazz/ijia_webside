import { BulletChat } from "@/api.ts";
import { api } from "@/request/client.ts";
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
  const stream = createStream();
  const reader = stream.getReader();
  let item = await reader.read();
  while (!item.done && !signal.aborted) {
    yield item.value;
    await new Promise((r) => setTimeout(r, 2000));
    item = await reader.read();
  }
}
function createStream() {
  let offset = 0;
  return new ReadableStream<BulletChat>(
    {
      async pull(controller) {
        const res = await api["/live/screen/bullet-chart"].get({ query: { index: offset++ } });
        for (const item of res.items) {
          controller.enqueue(item);
        }
        if (!res.has_more) {
          controller.close();
        }
      },
    },
    {
      highWaterMark: 15,
      size: (chunk) => 1,
    },
  );
}
