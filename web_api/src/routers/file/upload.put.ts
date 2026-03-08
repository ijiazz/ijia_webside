import routeGroup from "./_route.ts";
import { requiredLogin } from "@/middleware/auth.ts";
import { UploadFileResult, UploadMethod } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";
import { uploadQuestion } from "./_utils/uploadQuestion.ts";

type Param = {
  stream: ReadableStream;
  type: string;
  fileSize?: number;
  method: UploadMethod;
};
export default routeGroup.create({
  method: "PUT",
  routePath: "/file/upload",
  middlewares: [requiredLogin],
  async validateInput(ctx): Promise<Param> {
    const { req } = ctx;
    const raw = req.raw;
    const rawContentType = raw.headers.get("Content-Type");
    if (!rawContentType) {
      throw new HttpError(400, "Content-Type 不能为空");
    }
    if (!raw.body) {
      throw new HttpError(400, "请求体不能为空");
    }
    const method = (req.query("method") ?? "") as UploadMethod;
    const fileSize = req.header("Content-Length");

    return {
      stream: raw.body,
      type: rawContentType,
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
