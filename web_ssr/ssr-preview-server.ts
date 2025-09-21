import path from "node:path";
import { Hono } from "jsr:@hono/hono";
import { serveStatic } from "jsr:@hono/hono/deno";

const isProd = false;
interface RenderServer {
  renderByStream(req: Request): Promise<Response>;
}
let renderer: RenderServer;

if (isProd) {
  renderer = await import("@ssr-render");
} else {
  renderer = await import("@/index-server.tsx");
}

const hono = new Hono();

const fileDir = path.resolve(import.meta.dirname!, "../web/dist/client");

hono.use("/assets/*", serveStatic({ root: path.relative(".", fileDir) }));

hono.on("GET", "*", function (ctx, next) {
  return renderer.renderByStream(ctx.req.raw);
});
Deno.serve({ port: 5273 }, hono.fetch);
