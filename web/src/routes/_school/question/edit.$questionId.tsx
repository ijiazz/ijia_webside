import { ExamUserQuestionDetail } from "@/api.ts";
import { api } from "@/request/client.ts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/question/edit/$questionId")({
  loader: async ({ params }) => {
    const { questionId } = params;
    const { item } = await api["/question/entity/:question_id"].get({ params: { question_id: questionId } });

    return { question: item };
  },
  gcTime: 0,
});
export type LoaderData = {
  question: ExamUserQuestionDetail;
};
