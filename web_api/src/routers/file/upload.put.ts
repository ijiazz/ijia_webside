import routeGroup from "./_route.ts";
import { requiredLogin } from "@/middleware/auth.ts";
import { UploadFileResult, UploadMethod } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";
import { uploadQuestion } from "./_utils/uploadQuestion.ts";
import * as mimeType from "@std/media-types";

export default routeGroup.create({
  method: "PUT",
  routePath: "/file/upload",
  middlewares: [requiredLogin],
  async validateInput(ctx) {
    const { req } = ctx;
    const raw = req.raw;
    const stream = raw.body;
    if (!stream) {
      throw new HttpError(400, "上传文件不能为空");
    }
    const [mime, info] = mimeType.parseMediaType(req.header("Content-Type") ?? "application/octet-stream");

    const fileSize = req.header("Content-Length");
    const method = ctx.req.query("method");
    return {
      stream,
      type: mime,
      method,
      fileSize: fileSize ? Number.parseInt(fileSize) : undefined,
    };
  },
  async handler({ stream, type, fileSize, method }): Promise<UploadFileResult> {
    switch (method) {
      case UploadMethod.question:
        return uploadQuestion(stream, { mime: type, fileSize });

      default:
        throw new HttpError(400, "不支持的上传类型");
    }
  },
});
