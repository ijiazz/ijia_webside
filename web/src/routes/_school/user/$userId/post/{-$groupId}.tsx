import { createFileRoute } from "@tanstack/react-router";
import { ShelfPostList } from "./-components/SelfPostLIst.tsx";

export const Route = createFileRoute("/_school/user/$userId/post/{-$groupId}")({
  component: RouteComponent,
});

function RouteComponent() {
  const { userId, groupId }: { userId: number; groupId: number } = Route.useParams();
  return (
    <div>
      <ShelfPostList groupId={groupId} userId={userId} />
    </div>
  );
}
