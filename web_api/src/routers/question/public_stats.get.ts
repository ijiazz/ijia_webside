import routeGroup from "./_route.ts";
import { getQuestionPublicStats } from "./_sql/question_stat.sql.ts";
import { requiredLogin } from "@/middleware/auth.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/question/public_stats",
  middlewares: [requiredLogin],
  handler(): Promise<{ reviewing_count: number; total_count: number }> {
    return getQuestionPublicStats();
  },
});
