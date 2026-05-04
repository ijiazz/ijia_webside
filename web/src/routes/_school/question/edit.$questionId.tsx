import { ExamUserQuestionDetail, ReviewStatus } from "@/api.ts";
import { api } from "@/request/client.ts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/question/edit/$questionId")({
  loader: async ({ params }) => {
    const { questionId } = params;
    const { item } = await api["/question/entity/:question_id"].get({ params: { question_id: questionId } });
    if (!item.review || ![ReviewStatus.pending, ReviewStatus.rejected].includes(item.review.status)) {
      throw "当前状态无法编辑";
    }
    return { question: item };
  },
  gcTime: 0,
});
export type LoaderData = {
  question: ExamUserQuestionDetail;
};
