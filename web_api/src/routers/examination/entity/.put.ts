import { checkValueAsync, queryInt } from "@/common/check.ts";
import routeGroup from "../_route.ts";
import { createExaminationByQuestionTotal } from "../_sql/examination_create.sql.ts";
import { optional } from "@asla/wokao";
import { HttpError } from "@/common/errors.ts";

export default routeGroup.create({
  method: "PUT",
  routePath: "/examination",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const body = await checkValueAsync(ctx.req.json(), [
      {
        template_id: queryInt,
        question_total: optional("undefined"),
      },
      { template_id: optional("undefined"), question_total: "number" },
    ] as const);

    return { userId, body };
  },
  async handler({ userId, body }): Promise<{ examination_id: string }> {
    let examinationId: number;
    const title = "模拟考试";
    if (typeof body.template_id === "number") {
      throw new HttpError(400, "自定义考试模板未开放");
      // examinationId = await createExaminationByTemplate(body.template_id, { title, userId });
    } else {
      examinationId = await createExaminationByQuestionTotal(body.question_total, { title, userId });
    }
    return { examination_id: examinationId.toString() };
  },
});
