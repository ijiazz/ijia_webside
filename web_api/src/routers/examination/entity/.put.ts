import { checkValueAsync } from "@/common/check.ts";
import routeGroup from "../_route.ts";
import { createExamination } from "../_sql/examination_create.sql.ts";
import { ExaminationCreateInput } from "@ijia/api-types";
import { optional } from "@asla/wokao";

export default routeGroup.create({
  method: "PUT",
  routePath: "/examination",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const body = await checkValueAsync(ctx.req.json(), [
      {
        template_id: "string",
        question_total: optional("undefined"),
      },
      { template_id: optional("undefined"), question_total: "number" },
    ] as const);

    return { userId, body };
  },
  async handler({
    userId,
    body,
  }: {
    userId: number;
    body: ExaminationCreateInput;
  }): Promise<{ examination_id: string }> {
    const examinationId = await createExamination(body, { title: "模拟考试", userId });
    return { examination_id: examinationId.toString() };
  },
});
