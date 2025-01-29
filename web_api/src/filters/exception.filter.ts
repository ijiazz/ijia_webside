import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from "@nestjs/common";
import { StatusCode } from "hono/utils/http-status";
import type { HonoResponse } from "nest-hono-adapter";
import { resolve } from "node:path/posix";
@Catch(Error)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor() {
    const pkgRoot = new URL(import.meta.url);
    pkgRoot.pathname = resolve(pkgRoot.pathname, "../../../..");
    this.#baseDir = pkgRoot.toString();
  }
  #baseDir: string;
  catch(error: HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<HonoResponse>();
    if (error instanceof Error) {
      if (error instanceof HttpException) {
        response.status(error.getStatus() as StatusCode);
        const html = createErrorText(error);
        response.send(response.html(html));
      } else {
        response.status(500);
        const html = createErrorText(error, { info: error.stack, baseDir: this.#baseDir });
        response.send(response.html(html));
      }
    } else {
      response.status(500);
      response.send(response.text(String(error)));
    }
  }
}
function createErrorText(error: Error, stack?: { info?: string; baseDir?: string }) {
  let text = `<h3>${error.name}</h3></br>`;

  let detail: string;
  if (stack && stack.info) {
    let stackInfo = stack.info;
    if (stack.baseDir) stackInfo = stackInfo.replaceAll(stack.baseDir, "");
    detail = stackInfo;
  } else detail = error.message;
  text += `<span style="white-space:pre-wrap; font-size:12px">${detail}</span>`;
  return text;
}
