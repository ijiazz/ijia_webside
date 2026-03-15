import routeGroup from "../_route.ts";
import { requiredRoles, Role } from "@/middleware/auth.ts";
import { getNextQuestionReview } from "../_sql/question.sql.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/question/review/next",
  middlewares: [requiredRoles(Role.Admin)],
  async handler() {
    return getNextQuestionReview();
  },
});
