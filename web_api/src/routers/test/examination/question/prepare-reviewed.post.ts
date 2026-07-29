import { checkValueAsync } from "@/common/check.ts";
import type { TestExaminationAPI } from "@ijia/api-types/test";
import { PREPARE_BODY_SCHEMA, throwNotImplemented } from "../-utils/prepare.ts";
import { createRoute } from "@/common/context.ts";

type PrepareReviewedBody = TestExaminationAPI["POST /test/question/prepare-reviewed"]["body"];
type PrepareReviewedResponse = TestExaminationAPI["POST /test/question/prepare-reviewed"]["response"];
  
export default createRoute<PrepareReviewedResponse, PrepareReviewedBody>({
  method: "POST",
  routePath: "/test/question/prepare-reviewed",
  validateInput({ req }) {
    return checkValueAsync(req.json(), PREPARE_BODY_SCHEMA);
  },
  handler() {
    throwNotImplemented();
  },
});