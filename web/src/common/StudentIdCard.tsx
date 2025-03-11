import { Avatar, Card } from "antd";
import { useCurrentUser } from "./user.ts";

export type StudentIdCardInfo = {
  avatarUrl?: string;
  id?: string;
  name?: string;
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

export function CurrentIdCard(props: { isBind?: boolean }) {
  const { isBind } = props;
  const { loading, value } = useCurrentUser();
  const info = value ?? { user_id: undefined, avatar_url: undefined, nickname: "", userIdStr: undefined };
  return <StudentIdCard avatarUrl={info.avatar_url} id={info.userIdStr?.padStart(6)} name={info.nickname} />;
}
