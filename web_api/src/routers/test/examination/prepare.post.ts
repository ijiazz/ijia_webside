import { checkValueAsync } from "@/common/check.ts";
import type { TestExaminationAPI } from "@ijia/api-types/test";
import { PREPARE_BODY_SCHEMA, throwNotImplemented } from "./-utils/prepare.ts";
import routeGroup from "./_route.ts";

type PrepareExaminationBody = TestExaminationAPI["POST /test/examination/prepare"]["body"];
type PrepareExaminationResponse = TestExaminationAPI["POST /test/examination/prepare"]["response"];

export default routeGroup.create<PrepareExaminationResponse, PrepareExaminationBody>({
  method: "POST",
  routePath: "/test/examination/prepare",
  validateInput({ req }) {
    return checkValueAsync(req.json(), PREPARE_BODY_SCHEMA);
  },
  handler() {
    throwNotImplemented();
  },
});