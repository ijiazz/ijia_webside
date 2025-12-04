import { requiredRoles, Role } from "@/middleware/auth.ts";
import routeGroup from "../_route.ts";
import { getReview } from "./-sql/post_review.sql.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/post/review/next",
  middlewares: [requiredRoles(Role.Admin, Role.PostReviewer)],
  async handler() {
    const target = await getReview();
    return { next: target };
  },
});
