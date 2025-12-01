import { GetBulletChatListRes, GetBulletChatParam } from "@/dto/live.ts";
import { checkValue, optionalInt } from "@/global/check.ts";
import { genGetBulletChart } from "../-sql/bullet.sql.ts";
import { appConfig } from "@/config.ts";
import routeGroup from "../_route.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/live/screen/bullet-chart",
  async validateInput(ctx) {
    const queries = ctx.req.query();
    return checkValue(queries, { index: optionalInt });
  },
  async handler(param: GetBulletChatParam): Promise<GetBulletChatListRes> {
    const { index = 0 } = param;
    const bulletChartConfig = appConfig.home.bulletChart;

    const target = bulletChartConfig.find((config) => {
      if (!config.enable) return false;
      const { enableDateEnd, enableDateStart } = config;
      const now = new Date();
      if (enableDateStart && now < enableDateStart) return false;
      if (enableDateEnd && now > enableDateEnd) return false;

      return true;
    });
    if (!target) {
      return {
        has_more: false,
        items: [],
      };
    }
    const pageSize = 50;
    const res = await genGetBulletChart({
      groupId: target.usePostId,
      pageSize,
      page: index,
    });
    return {
      items: res,
      has_more: res.length >= pageSize,
    };
  },
});
