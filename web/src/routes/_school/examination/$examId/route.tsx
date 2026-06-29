import { queryClient } from "@/request/client.ts";
import { getExaminationDetailQueryOption } from "@/request/examination.ts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/examination/$examId")({
  async loader(ctx) {
    const { examId } = ctx.params;
    const examDetail = await queryClient.fetchQuery(getExaminationDetailQueryOption(examId));
    return { examDetail };
  },
});
