import { Hono } from "hono";
export type ListenOption = {
  port: number;
  hostname: string;
  https?: { key: string; cert: string };
};
export type AppServer = {
  close(force?: boolean): Promise<void>;
};

export function listenHttpServer(hono: Hono, listenOption: ListenOption) {
  return listenUseDenoHttpServer(hono, listenOption);
}

function listenUseDenoHttpServer(hono: Hono, option: ListenOption): Promise<AppServer> {
  return new Promise<AppServer>(function (resolve, reject) {
    const { https: httpsOptions = { key: undefined, cert: undefined } } = option;
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
