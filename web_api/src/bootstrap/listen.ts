import { createAdaptorServer, ServerType } from "@hono/node-server";
import { Hono } from "hono";
import http from "node:http";
import https from "node:https";
export type ListenOption = {
  port: number;
  hostname: string;
  https?: { key: string; cert: string };
};
export type AppServer = {
  close(force?: boolean): Promise<void>;
};

export function listenHttpServer(hono: Hono, listenOption: ListenOption) {
  //@ts-ignore
  if (globalThis.Deno) {
    return listenUseDenoHttpServer(hono, listenOption);
  } else {
    return listenUseNodeHttpServer(hono, listenOption);
  }
}

function listenUseNodeHttpServer(hono: Hono, option: ListenOption): Promise<AppServer> {
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
  return new Promise<AppServer>((resolve, reject) => {
    server.once("listening", () => {
      server.removeAllListeners("error");
      const http: AppServer = {
        close(force) {
          return new Promise(function (resolve, reject) {
            server.close((err) => (err ? reject(err) : resolve()));
            if (force) server.unref();
          });
        },
      };
      resolve(http);
    });
    server.once("error", reject);
  });
}
function listenUseDenoHttpServer(hono: Hono, option: ListenOption): Promise<AppServer> {
  return new Promise<AppServer>(function (resolve, reject) {
    const { https: httpsOptions = { key: undefined, cert: undefined } } = option;
    //@ts-ignore
    const serve = Deno.serve(
      {
        onListen: () => {
          const server: AppServer = {
            close(force) {
              if (force) serve.unref();
              return serve.shutdown();
            },
          };
          resolve(server);
        },
        port: option.port,
        hostname: option.hostname,
        key: httpsOptions.key,
        cert: httpsOptions.cert,
      },
      hono.fetch,
    );
  });
}
