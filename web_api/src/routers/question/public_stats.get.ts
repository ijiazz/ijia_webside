import routeGroup from "./_route.ts";
import { getQuestionPublicStats } from "./_sql/question.sql.ts";
import { requiredLogin } from "@/middleware/auth.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/question/public_stats",
  middlewares: [requiredLogin],
  async handler() {
    return getQuestionPublicStats();
  },
});
