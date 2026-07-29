import { checkValueAsync } from "@/common/check.ts";
import type { TestExaminationAPI } from "@ijia/api-types/test";
import { PREPARE_BODY_SCHEMA, throwNotImplemented } from "../-utils/prepare.ts";
import { createRoute } from "@/common/context.ts";

type PrepareTemplateBody = TestExaminationAPI["POST /test/template/prepare"]["body"];
type PrepareTemplateResponse = TestExaminationAPI["POST /test/template/prepare"]["response"];

export default createRoute<PrepareTemplateResponse, PrepareTemplateBody>({
  method: "POST",
  routePath: "/test/template/prepare",
  validateInput({ req }) {
    return checkValueAsync(req.json(), PREPARE_BODY_SCHEMA);
  },
  handler() {
    throwNotImplemented();
  },
});
