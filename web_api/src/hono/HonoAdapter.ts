import { createAdaptorServer } from "@hono/node-server";
import https from "node:https";
import http from "node:http";
import { HonoAdapter, InitHttpServerConfig } from "nest-hono-adapter";

function initNodeHttpServer({ hono, forceCloseConnections, httpsOptions }: InitHttpServerConfig) {
  if (httpsOptions) {
    return createAdaptorServer({
      fetch: hono.fetch,
      createServer: https.createServer,
      serverOptions: { key: httpsOptions.key, cert: httpsOptions.cert },
    });
  } else {
    return createAdaptorServer({
      fetch: hono.fetch,
      createServer: http.createServer,
    });
  }
}
export function createHonoAdapter() {
  let honoAdapter: HonoAdapter;
  let serve: any;
  //@ts-ignore
  if (typeof globalThis.Deno?.serve === "function") {
    honoAdapter = new HonoAdapter({
      listen({ hono, port, forceCloseConnections, hostname, httpsOptions = {} }) {
        return new Promise((resolve) => {
          //@ts-ignore
          serve = Deno.serve(
            { onListen: resolve, port, hostname, key: httpsOptions.key, cert: httpsOptions.cert },
            hono.fetch,
          );
        });
      },
      close: () => serve!.shutdown(),
      address: () => serve!.addr.hostname,
    });
  } else {
    honoAdapter = new HonoAdapter({ initHttpServer: initNodeHttpServer });
  }
  return honoAdapter;
}
