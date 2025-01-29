import { serveDir } from "jsr:@std/http";
Deno.serve({ port: 8879, hostname: "127.0.0.1" }, async function (req) {
  return serveDir(req, { enableCors: true, fsRoot: "A:/code/appData/ijia_oos" });
});
