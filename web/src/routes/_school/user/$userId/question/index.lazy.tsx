import { createLazyFileRoute, useLoaderData } from "@tanstack/react-router";
import { UserQuestionList } from "./-components/UserQuestionList.tsx";

export const Route = createLazyFileRoute("/_school/user/$userId/question/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { userInfo: currentUser } = useLoaderData({ from: "/_school" });
  const { userId } = Route.useParams({
    select(params) {
      return {
        userId: Number.parseInt(params.userId),
      };
    },
  });
  const isSelf = !!currentUser && currentUser.user_id === userId;

  return <UserQuestionList canManage={isSelf} userId={userId} />;
}