import path from "node:path";
import { Hono } from "jsr:@hono/hono";
import { serveStatic } from "jsr:@hono/hono/deno";

const isProd = false;

let renderer: {
  renderToReadableStream(req: Request): Promise<ReadableStream>;
};

if (isProd) {
  const mod = await import("@ssr-render");
  renderer = mod.renderer;
} else {
  const mod = await import("@/index.server.tsx");
  renderer = mod.renderer;
}

const hono = new Hono();

const fileDir = path.resolve(import.meta.dirname!, "../web/dist/client");

hono.use("/assets/*", serveStatic({ root: path.relative(".", fileDir) }));

hono.on("GET", "*", async function (ctx, next) {
  const stream = await renderer.renderToReadableStream(ctx.req.raw);
  return new Response(stream, { headers: { "Content-Type": "text/html" } });
});
Deno.serve({ port: 5273 }, hono.fetch);
