export function setTimeoutUnRef(cb: () => void, ms: number): () => void {
  const timer = setTimeout(cb, ms);

  if (unrefTimer) {
    unrefTimer(timer);
  } else if (typeof (timer as any).unref === "function") {
    // Node.js 环境
    (timer as any).unref();
  } else throw new Error("不支持 unref 定时器的环境");
  return () => clearTimeout(timer as any);
}

//@ts-ignore
const unrefTimer = typeof globalThis.Deno === "object" ? globalThis.Deno.unrefTimer : undefined;
