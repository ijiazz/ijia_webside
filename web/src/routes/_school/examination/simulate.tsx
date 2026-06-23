import { queryClient } from "@/request/client.ts";
import { getGlobalQuestionStatQueryOption } from "@/request/question.ts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/examination/simulate")({
  loader: async () => {
    const data = await queryClient.fetchQuery(getGlobalQuestionStatQueryOption());
    return {
      stat: data,
    };
  },
});
