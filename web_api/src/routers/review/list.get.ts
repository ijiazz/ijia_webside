import { requiredRoles, Role } from "@/middleware/auth.ts";
import routeGroup from "./_route.ts";
import { GetReviewListOption, reviewSelect } from "./-sql/get_review_list.ts";
import { ListDto, ReviewItem } from "@/dto.ts";
import { v } from "@/sql/utils.ts";
import { dbPool } from "@/db/client.ts";
import { MultipleQueryResult } from "@asla/pg";
import { select } from "@asla/yoursql";

export default routeGroup.create({
  method: "GET",
  routePath: "/review/list",
  middlewares: [requiredRoles(Role.Admin)],
  async handler(): Promise<ListDto<ReviewItem<unknown>>> {
    return getReviewListWithTotal({ size: 10 });
  },
});
async function getReviewListWithTotal(option: GetReviewListOption): Promise<ListDto<ReviewItem<unknown>>> {
  const { size, offset, type } = option;

  const conditions: string[] = [];
  if (type) {
    conditions.push(`target_type=${v(type)}`);
  }
  const [list, total] = await dbPool.query<MultipleQueryResult>([
    reviewSelect().where(conditions).limit(size, offset),
    select("COUNT(*) as total").from("review").where(conditions),
  ]);
  return { items: list.rows ?? [], total: total.rows?.[0].total ?? 0 };
}
