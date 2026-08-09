import { queryClient } from "@/request/client.ts";
import { nextExaminationQuestionQueryOption } from "@/request/examination.ts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/examination/$examId/answer")({
  loader: async ({ context, params }) => {
    const { question } = await queryClient.fetchQuery(nextExaminationQuestionQueryOption(params.examId));
    return { question };
  },
});
