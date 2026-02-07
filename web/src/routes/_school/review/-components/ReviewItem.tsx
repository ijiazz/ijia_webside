import { type ReviewItem } from "@/api.ts";
import { RenderDisplayData } from "./RenderDisplayData.tsx";
import { Link } from "@tanstack/react-router";
import { Avatar } from "antd";
import { dateToString } from "@/common/date.ts";

type ReviewItemProps = {
  item: ReviewItem<unknown>;
};
export function ReviewItem(props: ReviewItemProps) {
  const { item } = props;

  return (
    <div>
      <div>
        <strong>审核内容预览:</strong>
        <div>{item.id}</div>
        <div>{item.target_type}</div>
        <div>{dateToString(item.create_time, "second")}</div>
        <div>{item.pass_count / item.reject_count}</div>
        <div>{item.is_reviewing}</div>
        <div>
          <div>{JSON.stringify(item.info, null, 2)}</div>
          <div>{JSON.stringify(item.review_display, null, 2)}</div>
        </div>
        <div>
          <div>{item.resolved_time}</div>
          {item.reviewer && (
            <div>
              <Avatar size="small" src={item.reviewer.avatar}>
                {item.reviewer.nickname}
              </Avatar>
              <Link to={`/user/${item.reviewer.user_id}`} target="_blank">
                {item.reviewer.nickname}
              </Link>
            </div>
          )}
          <div>{item.comment}</div>
        </div>
      </div>
      {renderItem(item)}
    </div>
  );
}
function renderItem(item: ReviewItem<unknown>) {
  switch (item.target_type) {
    default:
      return <RenderDisplayData data={item.review_display} />;
  }
}
