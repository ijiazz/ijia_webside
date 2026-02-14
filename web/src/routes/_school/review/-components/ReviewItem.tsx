import { type ReviewItem } from "@/api.ts";
import { RenderDisplayData } from "./RenderDisplayData.tsx";
import { Link } from "@tanstack/react-router";
import { Avatar, Collapse } from "antd";
import { dateToString } from "@/common/date.ts";
import { ReviewStatusBadge } from "./ReviewStatusBadge.tsx";
import * as styles from "./ReviewItem.css.ts";

type ReviewItemProps = {
  item: ReviewItem<unknown>;
};
export function ReviewItem(props: ReviewItemProps) {
  const { item } = props;

  return (
    <div className={styles.wrapper}>
      <Collapse
        size="small"
        items={[
          {
            key: "detail",
            label: "info",
            children: renderItem(item),
            extra: (
              <div className={styles.row}>
                <div>ID: {item.id}</div>
                <div>{item.target_type}</div>
              </div>
            ),
          },
        ]}
      />
      <div className={styles.row} style={{ justifyContent: "space-between" }}>
        <div>
          拒绝/通过：
          {item.reject_count} / {item.pass_count}
        </div>
        <ReviewStatusBadge isPass={item.is_passed} />
        <time>{dateToString(item.create_time, "second")}</time>
      </div>
      <div className={styles.reviewer}>
        {item.reviewer && (
          <div>
            <Avatar size="small" src={item.reviewer.avatar}>
              {item.reviewer.nickname}
            </Avatar>
            <Link to={`/user/$userId`} params={{ userId: item.reviewer.user_id.toString() }} target="_blank">
              {item.reviewer.nickname}
            </Link>
          </div>
        )}
        <div>{item.resolved_time}</div>
      </div>
      <div>{item.comment}</div>
      <strong>内容预览:</strong>
      <div className={styles.content}>
        <RenderDisplayData data={item.review_display ?? []} />
      </div>
    </div>
  );
}
function renderItem(item: ReviewItem<unknown>) {
  switch (item.target_type) {
    default:
      return <div style={{ whiteSpace: "pre" }}>{JSON.stringify(item.info, null, 2)}</div>;
  }
}
