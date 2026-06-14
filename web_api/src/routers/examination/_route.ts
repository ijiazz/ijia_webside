import { HonoContext } from "@/common/context.ts";
import { requiredLogin } from "@/middleware/auth.ts";
import { RouteGroup } from "@/lib/route.ts";

const routeGroup = new RouteGroup<HonoContext>({ middlewares: [requiredLogin] });
export default routeGroup;

export {
  createEmptyExamination,
  createExaminationByQuestionTotal,
  createExaminationByTemplate,
  type CreateExaminationOption,
} from "./_sql/examination_create.sql.ts";
