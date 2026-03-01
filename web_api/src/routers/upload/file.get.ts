import routeGroup from "./_route.ts";
import { requiredLogin } from "@/middleware/auth.ts";
import { getOSS } from "@ijia/data/oss";

export default routeGroup.create({
  method: "GET",
  routePath: "/upload/file/:fileKey",
  middlewares: [requiredLogin],
  async validateInput(ctx) {
    const { req } = ctx;
    const fileKey = req.param("fileKey");
    return fileKey;
  },
  async handler(fileKey): Promise<Response> {
    const oss = getOSS();
    const fd = await oss.tempDir.openRead(fileKey);
    const stream = fd.createReadable();
    return new Response(stream, { headers: {} });
  },
});
