import { createAdaptorServer, ServerType } from "@hono/node-server";
import { Hono } from "hono";
import http from "node:http";
import https from "node:https";
export type ListenOption = {
  port: number;
  hostname: string;
  https?: { key: string; cert: string };
};
export function listenUseNodeHttpServer(hono: Hono, option: ListenOption) {
  const { https: httpsOptions } = option;
  let server: ServerType;
  if (httpsOptions) {
    server = createAdaptorServer({
      fetch: hono.fetch,
      createServer: https.createServer,
      serverOptions: { key: httpsOptions.key, cert: httpsOptions.cert },
    });
  } else {
    server = createAdaptorServer({
      fetch: hono.fetch,
      createServer: http.createServer,
    });
  }
  server.listen(option.port, option.hostname);
  return new Promise<void>((resolve, reject) => {
    server.once("listening", () => {
      server.removeAllListeners("error");
      resolve();
    });
    server.once("error", reject);
  });
}
export function listenUseDenoHttpServer(hono: Hono, option: ListenOption) {
  return new Promise(function (resolve, reject) {
    const { https: httpsOptions = { key: undefined, cert: undefined } } = option;
    //@ts-ignore
    const serve = Deno.serve(
      {
        onListen: resolve,
        port: option.port,
        hostname: option.hostname,
        key: httpsOptions.key,
        cert: httpsOptions.cert,
      },
      hono.fetch,
    );
  });
}
