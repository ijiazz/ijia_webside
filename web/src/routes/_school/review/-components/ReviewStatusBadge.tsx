import { Tag } from "antd";
type ReviewStatusBadgeProps = {
  isPass?: boolean | null;
};
export function ReviewStatusBadge({ isPass: status }: ReviewStatusBadgeProps) {
  switch (status) {
    case true:
      return <Tag color="green">已通过</Tag>;
    case false:
      return <Tag color="red">已拒绝</Tag>;
    default:
      return <Tag color="blue">审核中</Tag>;
  }
}
