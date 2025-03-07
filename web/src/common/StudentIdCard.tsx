import { Avatar, Card } from "antd";

export type StudentIdCardInfo = {
  avatarUrl: string;
  id: number;
  name: string;
};

export function StudentIdCard(props: StudentIdCardInfo) {
  const studentInfo = props;
  return (
    <Card>
      <Avatar icon={<img src={props.avatarUrl}></img>}></Avatar>
      <span>{studentInfo.id}</span>
    </Card>
  );
}
