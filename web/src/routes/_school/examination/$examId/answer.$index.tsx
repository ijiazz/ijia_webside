import { nextExaminationQuestion } from "@/request/examination.ts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/examination/$examId/answer/$index")({
  async loader(ctx) {
    const { examId } = ctx.params;
    const { question } = await nextExaminationQuestion(examId);
    return { question };
  },
});
