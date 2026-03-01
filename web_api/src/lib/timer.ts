export function unrefTimer(timer: number | { unref: () => void }) {
  if (typeof timer === "number") {
    //@ts-ignore
    Deno.unrefTimer(timer);
  } else {
    timer.unref();
  }
}

export function setTimeoutUnRef(cb: () => void, ms: number): () => void {
  const timer = setTimeout(cb, ms);

  unrefTimer(timer);
  return () => clearTimeout(timer as any);
}
