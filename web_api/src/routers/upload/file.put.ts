import routeGroup from "./_route.ts";
import { requiredLogin } from "@/middleware/auth.ts";
import { UploadFileResult, UploadMethod } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";
import { uploadQuestion } from "./_utils/uploadQuestion.ts";

export default routeGroup.create({
  method: "PUT",
  routePath: "/upload/file",
  middlewares: [requiredLogin],
  async validateInput(ctx) {
    const { req } = ctx;
    const raw = req.raw;
    const stream = raw.body;
    const mime = req.header("Content-Type") ?? "application/octet-stream";
    const method = ctx.req.query("method");
    return {
      stream,
      type: mime,
      method,
    };
  },
  async handler({ stream, type, method }): Promise<UploadFileResult> {
    switch (method) {
      case UploadMethod.question:
        return uploadQuestion();

      default:
        throw new HttpError(400, "不支持的上传类型");
    }
  },
});
